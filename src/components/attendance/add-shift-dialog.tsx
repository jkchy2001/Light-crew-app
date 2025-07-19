
"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar, type CalendarProps } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState, type FormEvent, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Shift, Project, CrewMember, ProjectCrewAssignment, DOP, Gaffer } from "@/lib/types"
import { collection, addDoc, query, getDocs, where, orderBy, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"
import { Textarea } from "../ui/textarea"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"
import { ScrollArea } from "../ui/scroll-area"

const shiftIncrements = Array.from({length: 12}, (_, i) => (i + 1) * 0.25); // 0.25 to 3.0

const initialFormState = {
    selectedProjectId: '',
    selectedCrewAssignment: '', // Will be a stringified JSON of ProjectCrewAssignment
    dailyWage: 0,
    approvedShifts: '1',
    conveyance: 0,
    date: new Date(),
    callTime: '',
    shiftInTime: '',
    shiftOutTime: '',
    shiftOutDate: undefined as Date | undefined,
    notes: '',
    dop: '',
    gaffer: '',
    bestBoy: '',
};

type AddShiftDialogProps = {
  onShiftAdded: () => void;
};

export function AddShiftDialog({ onShiftAdded }: AddShiftDialogProps) {
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));
  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));
  const { data: dops, isLoading: dopsLoading } = useFirestoreQuery<DOP>(query(collection(db, "dops"), orderBy("name")));
  const { data: gaffers, isLoading: gaffersLoading } = useFirestoreQuery<Gaffer>(query(collection(db, "gaffers"), orderBy("name")));
  
  const projectCrewAssignments = useMemo(() => {
    if (!formState.selectedProjectId || !projects || !allCrew) return [];
    const selectedProject = projects.find(p => p.id === formState.selectedProjectId);
    if (!selectedProject || !selectedProject.crew) return [];
    
    return selectedProject.crew.map(assignment => {
        const member = allCrew.find(c => c.id === assignment.crewId);
        return {
            ...assignment,
            name: member?.name || 'Unknown Member'
        }
    }).filter(a => a.name !== 'Unknown Member'); // Filter out assignments with no matching crew profile
  }, [formState.selectedProjectId, projects, allCrew]);

  const bestBoyCrewForProject = useMemo(() => {
    if (!projectCrewAssignments) return [];
    const bestBoyAssignments = projectCrewAssignments.filter(c => c.designation.toLowerCase().includes('best boy'));
    const uniqueBestBoys = Array.from(new Map(bestBoyAssignments.map(item => [item.name, item])).values());
    return uniqueBestBoys;
  }, [projectCrewAssignments]);

  const totalEarning = useMemo(() => {
    const wage = isNaN(formState.dailyWage) ? 0 : formState.dailyWage;
    const shifts = isNaN(parseFloat(formState.approvedShifts)) ? 0 : parseFloat(formState.approvedShifts);
    const conv = isNaN(formState.conveyance) ? 0 : formState.conveyance;
    return (wage * shifts) + conv;
  }, [formState.dailyWage, formState.approvedShifts, formState.conveyance]);

  const handleValueChange = (field: keyof typeof initialFormState, value: any) => {
    setFormState(prevState => ({ ...prevState, [field]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
        handleValueChange('date', date);
        // If shift out date is before new shift in date, reset it
        if (formState.shiftOutDate && date > formState.shiftOutDate) {
            handleValueChange('shiftOutDate', undefined);
        }
    }
  }

  const handleProjectChange = (projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    setFormState(prev => ({
        ...initialFormState, // Reset form but keep date
        date: prev.date,
        selectedProjectId: projectId,
        dop: project?.dop || '',
        gaffer: project?.gaffer || '',
        bestBoy: project?.bestBoy || '',
    }));
  }

  const handleCrewAssignmentChange = (assignmentString: string) => {
    if (!assignmentString) return;
    const assignment: ProjectCrewAssignment = JSON.parse(assignmentString);
    setFormState(prev => ({
        ...prev,
        selectedCrewAssignment: assignmentString,
        dailyWage: assignment.dailyWage || 0,
    }));
  }
  
  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formState.selectedCrewAssignment || !formState.date || !formState.selectedProjectId || !formState.shiftInTime || !formState.shiftOutTime) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please fill all required fields: Project, Crew Role, Date, In Time, and Out Time.",
        });
        setIsLoading(false);
        return;
    }
    
    const assignment: ProjectCrewAssignment & {name?:string} = JSON.parse(formState.selectedCrewAssignment);
    const crewMember = allCrew?.find(c => c.id === assignment.crewId);

    if (!crewMember) {
        toast({ variant: "destructive", title: "Crew Member Not Found" });
        setIsLoading(false);
        return;
    }

    const shiftsRef = collection(db, "shifts");
    const q = query(shiftsRef, 
        where("crewId", "==", assignment.crewId), // Check against specific role document ID
        where("projectId", "==", formState.selectedProjectId),
        where("date", "==", format(formState.date, 'yyyy-MM-dd'))
    );

    const existingShiftSnapshot = await getDocs(q);
    if (!existingShiftSnapshot.empty) {
        toast({
            variant: "destructive",
            title: "Shift Already Exists",
            description: "A shift for this crew member in this role on this date already exists. Please edit the existing shift.",
        });
        setIsLoading(false);
        return;
    }

    const newShiftData: Omit<Shift, 'id'> = {
      crewId: assignment.crewId,
      mid: assignment.mid,
      mobile: crewMember.mobile,
      projectId: formState.selectedProjectId,
      designation: assignment.designation,
      date: format(formState.date, 'yyyy-MM-dd'),
      day: format(formState.date, 'EEEE'),
      callTime: formState.callTime,
      shiftInTime: formState.shiftInTime,
      shiftOutTime: formState.shiftOutTime,
      shiftDuration: parseFloat(formState.approvedShifts),
      earnedAmount: totalEarning,
      paidAmount: 0,
      paymentStatus: 'Not Paid',
      notes: formState.notes,
      dailyWage: formState.dailyWage
    };
    
    if (formState.shiftOutDate) {
        newShiftData.shiftOutDate = format(formState.shiftOutDate, 'yyyy-MM-dd');
    }

    try {
        await addDoc(collection(db, 'shifts'), newShiftData);
        toast({
            title: "Shift Added",
            description: `Shift for ${assignment.name} as ${assignment.designation} has been logged.`,
        });
        resetForm();
        setOpen(false);
        onShiftAdded();
    } catch (error) {
        console.error("Error adding shift: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add the shift. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const dataIsLoading = projectsLoading || crewLoading || dopsLoading || gaffersLoading;
  
  const selectedAssignment: ProjectCrewAssignment | null = formState.selectedCrewAssignment ? JSON.parse(formState.selectedCrewAssignment) : null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Shift
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Shift</DialogTitle>
          <DialogDescription>
            Log a new work shift for a crew member. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto">
              <div className="grid gap-x-8 gap-y-4 py-4 pr-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Project*</Label>
                  <Select name="project" required onValueChange={handleProjectChange} value={formState.selectedProjectId} disabled={projectsLoading}>
                      <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                      <SelectContent>
                          {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                    <Label>DOP</Label>
                    <Select name="dop" value={formState.dop} onValueChange={(v) => handleValueChange('dop', v)} disabled={dopsLoading || !formState.selectedProjectId}>
                        <SelectTrigger><SelectValue placeholder="Select DOP"/></SelectTrigger>
                        <SelectContent>
                            {dops?.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Gaffer</Label>
                    <Select name="gaffer" value={formState.gaffer} onValueChange={(v) => handleValueChange('gaffer', v)} disabled={gaffersLoading || !formState.selectedProjectId}>
                        <SelectTrigger><SelectValue placeholder="Select Gaffer"/></SelectTrigger>
                        <SelectContent>
                             {gaffers?.map(g => <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Best Boy</Label>
                    <Select name="bestBoy" value={formState.bestBoy} onValueChange={(v) => handleValueChange('bestBoy', v)} disabled={crewLoading || !formState.selectedProjectId}>
                        <SelectTrigger><SelectValue placeholder="Select Best Boy"/></SelectTrigger>
                        <SelectContent>
                            {bestBoyCrewForProject?.map(c => <SelectItem key={`${c.crewId}-${c.name}`} value={c.name!}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                  <Label>Crew Role*</Label>
                  <Select name="crew" required onValueChange={handleCrewAssignmentChange} value={formState.selectedCrewAssignment} disabled={!formState.selectedProjectId || crewLoading}>
                      <SelectTrigger><SelectValue placeholder="Select a crew member's role" /></SelectTrigger>
                      <SelectContent>
                          {projectCrewAssignments.map(c => (
                            <SelectItem key={`${c.crewId}-${c.designation}`} value={JSON.stringify(c)}>
                                {c.name} - <span className="text-muted-foreground">{`(${c.mid} - ${c.designation})`}</span>
                            </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Daily Wage</Label>
                  <Input readOnly value={formState.dailyWage} placeholder="Auto-filled from crew role" />
                </div>
                
                 <div className="space-y-2">
                    <Label>Shift In Date*</Label>
                    <DatePicker date={formState.date} setDate={handleDateChange} />
                </div>
                
                <div className="space-y-2">
                    <Label>Day</Label>
                    <Input readOnly value={formState.date ? format(formState.date, 'EEEE') : ''} />
                </div>

                <div className="space-y-2">
                    <Label>Call Time</Label>
                    <Input type="time" value={formState.callTime} onChange={e => handleValueChange('callTime', e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Shift In Time*</Label>
                    <Input type="time" required value={formState.shiftInTime} onChange={e => handleValueChange('shiftInTime', e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Shift Out Time*</Label>
                    <Input type="time" required value={formState.shiftOutTime} onChange={e => handleValueChange('shiftOutTime', e.target.value)} />
                </div>

                <div className="space-y-2">
                    <Label>Shift Out Date</Label>
                    <DatePicker 
                        date={formState.shiftOutDate} 
                        setDate={(d) => handleValueChange('shiftOutDate', d)} 
                        label="Optional"
                        disabled={{ before: formState.date }}
                    />
                </div>

                <div className="space-y-2">
                  <Label>Approved Shifts*</Label>
                  <Select name="approvedShifts" required value={formState.approvedShifts} onValueChange={(v) => handleValueChange('approvedShifts', v)}>
                      <SelectTrigger><SelectValue placeholder="Select shift duration" /></SelectTrigger>
                      <SelectContent>
                        {shiftIncrements.map(inc => (
                          <SelectItem key={inc} value={inc.toString()}>{inc.toFixed(2)}</SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Conveyance</Label>
                  <Input type="number" value={formState.conveyance} onChange={(e) => handleValueChange('conveyance', parseFloat(e.target.value) || 0)} placeholder="Optional conveyance amount"/>
                </div>

                <div className="space-y-2">
                  <Label>Total Earning</Label>
                  <Input value={totalEarning.toLocaleString()} className="font-semibold text-lg h-11" readOnly disabled />
                </div>

                <div className="space-y-2 md:col-span-full">
                  <Label>Notes</Label>
                  <Textarea placeholder="Add any notes for this shift (optional)" value={formState.notes} onChange={e => handleValueChange('notes', e.target.value)} />
                </div>
              </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || dataIsLoading}>{isLoading ? 'Submitting...' : 'Submit Attendance'}</Button>
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
          disabled={disabled}
        />
      </PopoverContent>
    </Popover>
  )
}
