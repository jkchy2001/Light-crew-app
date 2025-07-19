
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, type FormEvent, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Shift, Payment, CrewMember } from "@/lib/types"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc, addDoc, deleteDoc, orderBy } from "firebase/firestore"
import { ScrollArea } from "../ui/scroll-area"
import { format } from "date-fns"
import { Trash2 } from "lucide-react"

interface CrewMemberWithFinancials extends CrewMember {
  balance: number;
}

type UpdatePaymentDialogProps = {
  crewMember: CrewMemberWithFinancials;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
};

export function UpdatePaymentDialog({ crewMember, open, onOpenChange, projectId }: UpdatePaymentDialogProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState(0);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const fetchPaymentHistory = async () => {
        if (!open) return;
        setIsHistoryLoading(true);
        const paymentsRef = collection(db, "payments");
        // Removed orderBy to prevent index error. Sorting is now done on the client.
        const q = query(
            paymentsRef,
            where("crewId", "==", crewMember.id),
            where("projectId", "==", projectId)
        );
        const querySnapshot = await getDocs(q);
        const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
        
        // Sort the history by date in descending order on the client
        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setPaymentHistory(history);
        setIsHistoryLoading(false);
    }

    useEffect(() => {
        fetchPaymentHistory();
    }, [open, crewMember.id, projectId]);


    const distributePayments = async (amountToDistribute: number, operation: 'add' | 'subtract') => {
        const shiftsRef = collection(db, "shifts");
        const q = query(
            shiftsRef,
            where("crewId", "==", crewMember.id),
            where("projectId", "==", projectId)
        );
        const querySnapshot = await getDocs(q);
        
        const shifts = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Shift))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const batch = writeBatch(db);
        let remainingAmount = amountToDistribute;

        for (const shift of shifts) {
            if (remainingAmount <= 0) break;

            const shiftDocRef = doc(db, "shifts", shift.id);

            if (operation === 'add') {
                const shiftBalance = shift.earnedAmount - shift.paidAmount;
                if (shiftBalance <= 0) continue;

                const paymentForThisShift = Math.min(remainingAmount, shiftBalance);
                const newPaidAmount = shift.paidAmount + paymentForThisShift;
                const newPaymentStatus = newPaidAmount >= shift.earnedAmount ? 'Paid' : 'Partially Paid';
                
                batch.update(shiftDocRef, {
                    paidAmount: newPaidAmount,
                    paymentStatus: newPaymentStatus,
                });
                remainingAmount -= paymentForThisShift;
            } else { // subtract
                if (shift.paidAmount <= 0) continue;
                
                const amountToReverse = Math.min(remainingAmount, shift.paidAmount);
                const newPaidAmount = shift.paidAmount - amountToReverse;
                const newPaymentStatus = newPaidAmount > 0 ? 'Partially Paid' : 'Not Paid';

                batch.update(shiftDocRef, {
                    paidAmount: newPaidAmount,
                    paymentStatus: newPaymentStatus
                });
                remainingAmount -= amountToReverse;
            }
        }
        await batch.commit();
    };


    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        if (amount <= 0) {
            toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a positive amount." });
            setIsLoading(false);
            return;
        }

        if (amount > crewMember.balance) {
            toast({ variant: "destructive", title: "Overpayment", description: `Amount cannot be greater than the balance of ₹${crewMember.balance.toLocaleString()}.` });
            setIsLoading(false);
            return;
        }

        try {
            // 1. Create a new payment document
            const newPayment: Omit<Payment, 'id'> = {
                crewId: crewMember.id,
                mid: crewMember.mid,
                projectId,
                amount,
                date: new Date().toISOString()
            };
            await addDoc(collection(db, 'payments'), newPayment);

            // 2. Distribute the paid amount across shifts
            await distributePayments(amount, 'add');

            toast({
                title: "Payment Updated",
                description: `Paid ₹${amount.toLocaleString()} to ${crewMember.name}.`,
            });
            setAmount(0);
            fetchPaymentHistory(); // Refresh history
        } catch (error) {
            console.error("Error updating payment: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update payment." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReversePayment = async (paymentToReverse: Payment) => {
        setIsLoading(true);
        try {
            // 1. Delete the payment document
            await deleteDoc(doc(db, "payments", paymentToReverse.id));
            
            // 2. Reverse the paid amount from shifts
            await distributePayments(paymentToReverse.amount, 'subtract');

            toast({
                title: "Payment Reversed",
                description: `Reversed payment of ₹${paymentToReverse.amount.toLocaleString()}.`,
                variant: 'destructive'
            });
            fetchPaymentHistory(); // Refresh history
        } catch (error) {
            console.error("Error reversing payment: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to reverse payment." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Update Payment for {crewMember.name}</DialogTitle>
                    <DialogDescription>
                        The current balance is ₹{crewMember.balance.toLocaleString()}. Enter amount being paid.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount === 0 ? '' : amount}
                                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                className="col-span-3"
                                placeholder={`Max: ₹${crewMember.balance.toLocaleString()}`}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || amount <= 0 || amount > crewMember.balance}>
                            {isLoading ? 'Updating...' : 'Add Payment'}
                        </Button>
                    </DialogFooter>
                </form>

                <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Payment History</h4>
                    <ScrollArea className="h-40 w-full rounded-md border p-2">
                         {isHistoryLoading ? <p>Loading history...</p> : 
                            paymentHistory.length > 0 ? (
                                <ul className="space-y-2">
                                    {paymentHistory.map(p => (
                                        <li key={p.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                                            <div>
                                                <p className="font-semibold">₹{p.amount.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">{format(new Date(p.date), 'dd MMM yyyy, p')}</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-destructive hover:text-destructive"
                                                onClick={() => handleReversePayment(p)}
                                                disabled={isLoading}
                                                aria-label="Reverse transaction"
                                            >
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-muted-foreground p-4">No payment history found.</p>
                            )
                         }
                    </ScrollArea>
                </div>
                 <DialogFooter className="pt-4 border-t">
                    <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isLoading}>Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
