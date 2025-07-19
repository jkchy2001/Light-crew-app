
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import type { Shift, CrewMember, Project } from '@/lib/types';
import { format } from 'date-fns';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '../ui/scroll-area';

type ShiftDetailViewProps = {
  shift: Shift | null;
  crewMember: CrewMember;
  project: Project;
  date: Date;
  onBack: () => void;
  onEdit: (shift: Shift) => void;
  onDelete: () => void;
};

const getStatusBadgeVariant = (status: string | undefined): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    if (!status) return "outline";
    switch (status) {
      case "Paid": return "default";
      case "Partially Paid": return "secondary";
      case "Not Paid": return "destructive";
      default: return "outline";
    }
}

export function ShiftDetailView({ shift, crewMember, project, date, onBack, onEdit, onDelete }: ShiftDetailViewProps) {
  const isMobile = useIsMobile();

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Shift Details</CardTitle>
            <CardDescription>
              {crewMember.name} for {project.name} on {format(date, 'PPP')}
            </CardDescription>
          </div>
           <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
           </Button>
        </div>
      </CardHeader>
      <CardContent>
        {shift ? (
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
            <Label>Day</Label>
            <Input readOnly value={shift.day || 'N/A'} />
            </div>
            <div className="space-y-1">
            <Label>Call Time</Label>
            <Input readOnly value={shift.callTime || 'N/A'} />
            </div>
            <div className="space-y-1">
            <Label>Shift In</Label>
            <Input readOnly value={`${shift.date} at ${shift.shiftInTime}`} />
            </div>
            <div className="space-y-1">
            <Label>Shift Out</Label>
            <Input readOnly value={`${shift.shiftOutDate || shift.date} at ${shift.shiftOutTime}`} />
            </div>
            <div className="space-y-1">
            <Label>Shift Duration</Label>
            <Input readOnly value={`${shift.shiftDuration.toFixed(2)} shifts`} />
            </div>
            <div className="space-y-1">
            <Label>Total Earning</Label>
            <Input readOnly value={`₹${shift.earnedAmount.toLocaleString()}`} />
            </div>
            <div className="space-y-1">
            <Label>Paid Amount</Label>
            <Input readOnly value={`₹${shift.paidAmount.toLocaleString()}`} />
            </div>
            <div className="space-y-1">
            <Label>Balance</Label>
            <Input readOnly className="font-semibold" value={`₹${(shift.earnedAmount - shift.paidAmount).toLocaleString()}`} />
            </div>
            <div className="space-y-1">
            <Label>Payment Status</Label>
            <div>
                <Badge variant={getStatusBadgeVariant(shift.paymentStatus)} className="text-sm px-3 py-1">{shift.paymentStatus}</Badge>
            </div>
            </div>
            {shift.notes && (
                <div className="space-y-1 md:col-span-full">
                    <Label>Notes</Label>
                    <Textarea readOnly value={shift.notes} rows={3} className="text-sm text-muted-foreground bg-muted/30 break-words"/>
                </div>
            )}
        </div>
        ) : (
        <div className="text-center py-8">
            <h3 className="text-lg font-semibold">No Shift Recorded</h3>
            <p className="text-muted-foreground">No shift recorded for this crew member on this day.</p>
            <p className="text-sm text-muted-foreground mt-2">You can add a new shift using the button in the header.</p>
        </div>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-2 pt-6 border-t">
        {shift && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Shift
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this shift entry.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={() => onEdit(shift)}>
              <Edit className="mr-2 h-4 w-4" /> Edit Shift
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
