
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, type FormEvent } from "react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "../ui/scroll-area"
import type { CrewMember, Designation } from "@/lib/types"
import { doc, updateDoc, collection, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"
import { Textarea } from "../ui/textarea"

type EditCrewDialogProps = {
  crewMember: CrewMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCrewUpdated: () => void;
};

export function EditCrewDialog({ crewMember, open, onOpenChange, onCrewUpdated }: EditCrewDialogProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false);

  const { data: designations, isLoading: designationsLoading } = useFirestoreQuery<Designation>(
    query(collection(db, "designations"), orderBy("title"))
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const crewRef = doc(db, "crew", crewMember.id);

    const updatedData: Partial<Omit<CrewMember, 'id' | 'mid'>> = {
      name: formData.get("full-name") as string,
      mobile: formData.get("mobile") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      designation: formData.get("designation") as string,
      dailyWage: Number(formData.get("daily-wage")),
      notes: formData.get('notes') as string,
    };

    try {
      await updateDoc(crewRef, updatedData);
      toast({
        title: "Crew Role Updated",
        description: `The role for "${updatedData.name}" has been successfully updated.`,
      })
      onCrewUpdated();
      onOpenChange(false);
    } catch(error) {
       console.error("Error updating crew member role:", error);
       toast({
         title: "Error",
         description: "Could not update crew member role. Please try again.",
         variant: "destructive"
       });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Crew Role Profile</DialogTitle>
          <DialogDescription>
            Update the details for this specific role profile (MID: {crewMember.mid}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="member-id" className="text-right">Member ID</Label>
                <Input name="member-id" id="member-id" defaultValue={crewMember.mid} className="col-span-3" disabled />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full-name" className="text-right">Full Name*</Label>
                <Input name="full-name" id="full-name" defaultValue={crewMember.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">Mobile*</Label>
                <Input name="mobile" id="mobile" type="tel" defaultValue={crewMember.mobile} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input name="email" id="email" type="email" defaultValue={crewMember.email} placeholder="Optional email address" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="address" className="text-right pt-2">Address</Label>
                <Textarea name="address" id="address" defaultValue={crewMember.address} placeholder="Optional address" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Designation*</Label>
                <Select name="designation" required defaultValue={crewMember.designation}>
                    <SelectTrigger className="col-span-3" disabled={designationsLoading}>
                        <SelectValue placeholder="Select designation" />
                    </SelectTrigger>
                    <SelectContent>
                         {designations?.map((d) => (
                           <SelectItem key={d.id} value={d.title}>{d.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="daily-wage" className="text-right">Daily Wage*</Label>
                <Input name="daily-wage" id="daily-wage" type="number" defaultValue={crewMember.dailyWage} placeholder="Set wage for this specific role" className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <Textarea name="notes" id="notes" defaultValue={crewMember.notes} placeholder="Optional notes about this crew member" className="col-span-3" />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
             <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || designationsLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
