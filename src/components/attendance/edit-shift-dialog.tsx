
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar, type CalendarProps } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { useState, type FormEvent, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Shift, CrewMember, Project } from "@/lib/types"
import { doc, updateDoc, collection, query, where, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Textarea } from "../ui/textarea"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"
import { ScrollArea } from "../ui/scroll-area"

type EditShiftDialogProps = {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShiftUpdated: () => void;
};

const shiftIncrements = Array.from({length: 12}, (_, i) => (i + 1) * 0.25); // 0.25 to 3.0

export function EditShiftDialog({ shift, open, onOpenChange, onShiftUpdated }: EditShiftDialogProps) {
  const { toast } = useToast();
  
  const [crewMember, setCrewMember] = useState<CrewMember | null>(null);
  const [project, setProject] = useState<Project | null>(null);

  const [date, setDate] = useState<Date | undefined>();
  const [day, setDay] = useState('');
  const [callTime, setCallTime] = useState('');
  const [shiftInTime, setShiftInTime] = useState('');
  const [shiftOutTime, setShiftOutTime] = useState('');
  const [shiftOutDate, setShiftOutDate] = useState<Date | undefined>();
  const [approvedShifts, setApprovedShifts] = useState('1');
  const [conveyance, setConveyance] = useState(0);
  const [dailyWage, setDailyWage] = useState(0);
  const [totalEarning, setTotalEarning] = useState(0);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (shift) {
      const fetchRelatedData = async () => {
        setIsLoading(true);
        // Fetch project
        const projectDocRef = doc(db, 'projects', shift.projectId);
        const projectDocSnap = await getDoc(projectDocRef);
        if (projectDocSnap.exists()) {
          const projectData = projectDocSnap.data() as Project;
          setProject(projectData);

          // Find crew assignment within the project to get the correct wage
          const assignment = projectData.crew.find(c => c.crewId === shift.crewId);
          const wage = assignment?.dailyWage || shift.dailyWage || 0;
          setDailyWage(wage);

          const calculatedConveyance = shift.earnedAmount - (wage * shift.shiftDuration);
          setConveyance(calculatedConveyance > 0 ? calculatedConveyance : 0);
        }
        
        // Fetch crew member
        const crewDocRef = doc(db, 'crew', shift.crewId);
        const crewDocSnap = await getDoc(crewDocRef);
        if (crewDocSnap.exists()) {
          setCrewMember(crewDocSnap.data() as CrewMember);
        }
        
        // Set state from shift object
        const shiftInDate = shift.date instanceof Date ? shift.date : parseISO(shift.date);
        setDate(shiftInDate);
        setDay(shift.day || (shiftInDate ? format(shiftInDate, 'EEEE') : ''));
        setCallTime(shift.callTime || '');
        setShiftInTime(shift.shiftInTime || '');
        setShiftOutTime(shift.shiftOutTime || '');
        setShiftOutDate(shift.shiftOutDate ? (shift.shiftOutDate instanceof Date ? shift.shiftOutDate : parseISO(shift.shiftOutDate)) : undefined);
        setApprovedShifts(shift.shiftDuration.toString());
        setNotes(shift.notes || '');
        setTotalEarning(shift.earnedAmount);

        setIsLoading(false);
      }
      fetchRelatedData();
    }
  }, [shift]);

  useEffect(() => {
    const wage = isNaN(dailyWage) ? 0 : dailyWage;
    const shiftsValue = isNaN(parseFloat(approvedShifts)) ? 0 : parseFloat(approvedShifts);
    const conv = isNaN(conveyance) ? 0 : conveyance;
    setTotalEarning((wage * shiftsValue) + conv);
  }, [dailyWage, approvedShifts, conveyance]);

  const handleDateChange = (newDate: Date | undefined) => {
      setDate(newDate);
      if (newDate) {
          setDay(format(newDate, 'EEEE'));
          if(shiftOutDate && newDate > shiftOutDate) {
              setShiftOutDate(undefined);
          }
      }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!date || !crewMember) {
        toast({ variant: "destructive", title: "Missing Information" });
        setIsLoading(false);
        return;
    }
    
    const shiftRef = doc(db, "shifts", shift.id);

    const updatedData: Partial<Shift> = {
        date: format(date, 'yyyy-MM-dd'),
        day,
        callTime,
        shiftInTime,
        shiftOutTime,
        shiftDuration: parseFloat(approvedShifts),
        earnedAmount: totalEarning,
        notes,
        dailyWage,
    };

    if (shiftOutDate) {
        updatedData.shiftOutDate = format(shiftOutDate, 'yyyy-MM-dd');
    } else {
        updatedData.shiftOutDate = ''; // Send empty string to remove
    }

    try {
        await updateDoc(shiftRef, updatedData);
        toast({
            title: "Shift Updated",
            description: `Shift for ${crewMember.name} has been updated.`,
        });
        onShiftUpdated();
        onOpenChange(false);
    } catch (error) {
        console.error("Error updating shift: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update shift." });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Shift</DialogTitle>
          <DialogDescription>
            Update details for {crewMember?.name || '...'} on {shift?.date ? format(shift.date instanceof Date ? shift.date : parseISO(shift.date), 'PPP') : '...'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto">
              <div className="space-y-4 py-4 pr-4">
                <div className="space-y-2">
                  <Label>Shift In Date*</Label>
                  <DatePicker date={date} setDate={handleDateChange} />
                </div>

                 <div className="space-y-2">
                      <Label>Day</Label>
                      <Input readOnly value={day} />
                  </div>

                  <div className="space-y-2">
                      <Label>Call Time</Label>
                      <Input type="time" value={callTime} onChange={e => setCallTime(e.target.value)} disabled={isLoading}/>
                  </div>

                  <div className="space-y-2">
                      <Label>Shift In Time*</Label>
                      <Input type="time" required value={shiftInTime} onChange={e => setShiftInTime(e.target.value)} disabled={isLoading}/>
                  </div>

                  <div className="space-y-2">
                      <Label>Shift Out Time*</Label>
                      <Input type="time" required value={shiftOutTime} onChange={e => setShiftOutTime(e.target.value)} disabled={isLoading}/>
                  </div>

                  <div className="space-y-2">
                      <Label>Shift Out Date</Label>
                      <DatePicker 
                          date={shiftOutDate} 
                          setDate={setShiftOutDate} 
                          label="Optional"
                          disabled={{ before: date! }}
                      />
                  </div>
                
                <div className="space-y-2">
                  <Label>Approved Shifts*</Label>
                  <Select name="approvedShifts" required value={approvedShifts} onValueChange={setApprovedShifts} disabled={isLoading}>
                      <SelectTrigger><SelectValue placeholder="Select shift duration" /></SelectTrigger>
                      <SelectContent>
                        {shiftIncrements.map(inc => (
                          <SelectItem key={inc} value={inc.toString()}>{inc.toFixed(2)}</SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Daily Wage</Label>
                  <Input type="number" value={dailyWage} placeholder="Daily wage" disabled={true}/>
                </div>

                 <div className="space-y-2">
                    <Label>Conveyance</Label>
                    <Input type="number" value={conveyance} onChange={(e) => setConveyance(parseFloat(e.target.value) || 0)} placeholder="Optional conveyance amount" disabled={isLoading}/>
                  </div>
                
                <div className="space-y-2">
                  <Label>Total Earning</Label>
                  <Input value={totalEarning.toLocaleString()} className="font-semibold text-lg h-11" readOnly disabled />
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Add any notes for this shift (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isLoading} />
                </div>
              </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DatePicker({ date, setDate, label = "Pick a date", disabled }: { date?: Date, setDate: (date?: Date) => void, label?: string, disabled?: CalendarProps['disabled'] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{label}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
          disabled={disabled || { after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  )
}
