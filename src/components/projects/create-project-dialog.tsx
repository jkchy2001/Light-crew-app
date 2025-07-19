
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useState, type FormEvent, useRef, useMemo, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Project, CrewMember, ProjectCrewAssignment } from "@/lib/types"
import { collection, addDoc, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"

export function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [selectedDopId, setSelectedDopId] = useState('');
  const [selectedGafferId, setSelectedGafferId] = useState('');
  const [selectedBestBoyId, setSelectedBestBoyId] = useState('');
  const [assignedCrew, setAssignedCrew] = useState<ProjectCrewAssignment[]>([]);

  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));

  const dops = useMemo(() => allCrew?.filter(c => c.designation.toLowerCase() === 'dop') || [], [allCrew]);
  const gaffers = useMemo(() => allCrew?.filter(c => c.designation.toLowerCase() === 'gaffer') || [], [allCrew]);
  const bestBoys = useMemo(() => allCrew?.filter(c => c.designation.toLowerCase().includes('best boy')) || [], [allCrew]);

  useEffect(() => {
    const newAssignments: ProjectCrewAssignment[] = [];
    const addedMids = new Set<string>();

    const addAssignment = (crewId: string) => {
      if (!crewId) return;
      const member = allCrew?.find(c => c.id === crewId);
      if (member && !addedMids.has(member.mid)) {
        newAssignments.push({
          crewId: member.id,
          mid: member.mid,
          designation: member.designation,
          dailyWage: member.dailyWage || 0,
        });
        addedMids.add(member.mid);
      }
    };

    addAssignment(selectedDopId);
    addAssignment(selectedGafferId);
    addAssignment(selectedBestBoyId);

    setAssignedCrew(newAssignments);

  }, [selectedDopId, selectedGafferId, selectedBestBoyId, allCrew]);


  const handleWageChange = (crewId: string, newWage: number) => {
      setAssignedCrew(prev => prev.map(c => c.crewId === crewId ? { ...c, dailyWage: newWage } : c));
  }
  
  const resetForm = () => {
      formRef.current?.reset();
      setStartDate(undefined);
      setEndDate(undefined);
      setSelectedDopId('');
      setSelectedGafferId('');
      setSelectedBestBoyId('');
      setAssignedCrew([]);
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const dop = allCrew?.find(c => c.id === selectedDopId);
    const gaffer = allCrew?.find(c => c.id === selectedGafferId);
    const bestBoy = allCrew?.find(c => c.id === selectedBestBoyId);

    const newProjectData: Omit<Project, 'id'> = {
      name: formData.get("name") as string,
      client: formData.get("client") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as string,
      dop: dop?.name || '',
      gaffer: gaffer?.name || '',
      bestBoy: bestBoy?.name || '',
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : "",
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : "",
      location: formData.get("locations") as string,
      crew: assignedCrew,
      notes: formData.get('notes') as string,
    };

    try {
      await addDoc(collection(db, "projects"), newProjectData);
      toast({
        title: "Project Created",
        description: `"${newProjectData.name}" has been successfully added.`,
      });
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Could not create the project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const dataIsLoading = crewLoading;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Project
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new project. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Project Name*</Label>
                <Input id="name" name="name" placeholder="e.g., Summer Ad Campaign" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">Client Name</Label>
                <Input id="client" name="client" placeholder="e.g., Acme Corporation" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea id="description" name="description" placeholder="Project details..." className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status*</Label>
                  <Select name="status" required>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="Upcoming">Upcoming</SelectItem>
                          <SelectItem value="Ongoing">Ongoing</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">DOP</Label>
                  <Select name="dop" onValueChange={setSelectedDopId} value={selectedDopId} disabled={crewLoading}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select Director of Photography" />
                      </SelectTrigger>
                      <SelectContent>
                          {dops?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Gaffer</Label>
                  <Select name="gaffer" onValueChange={setSelectedGafferId} value={selectedGafferId} disabled={crewLoading}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select Gaffer" />
                      </SelectTrigger>
                      <SelectContent>
                           {gaffers?.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Best Boy</Label>
                  <Select name="bestBoy" onValueChange={setSelectedBestBoyId} value={selectedBestBoyId} disabled={crewLoading}>
                      <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select Best Boy" />
                      </SelectTrigger>
                      <SelectContent>
                           {bestBoys.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
              {assignedCrew.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Final Crew List</Label>
                    <div className="col-span-3 space-y-2 rounded-md border p-2 max-h-40 overflow-y-auto">
                        {assignedCrew.map(assignment => {
                            const member = allCrew?.find(c => c.id === assignment.crewId);
                            return (
                                <div key={assignment.crewId} className="grid grid-cols-[1fr_auto] items-center gap-2">
                                    <Label className="flex-1 truncate">{member?.name} ({member?.designation})</Label>
                                    <div className="w-28">
                                      <Input
                                          type="number"
                                          value={assignment.dailyWage}
                                          onChange={(e) => handleWageChange(assignment.crewId, Number(e.target.value))}
                                          className="h-8"
                                          placeholder="Wage"
                                      />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
              )}
               <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Dates</Label>
                  <div className="col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <DatePicker date={startDate} setDate={setStartDate} label="Start Date" />
                      <DatePicker date={endDate} setDate={setEndDate} label="End Date" />
                  </div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="locations" className="text-right">Locations</Label>
                <Input id="locations" name="locations" placeholder="Mumbai, Delhi, Goa (comma-separated)" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Optional project notes..." className="col-span-3" />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || dataIsLoading}>{isLoading ? 'Creating...' : 'Create Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DatePicker({ label, date, setDate }: { label: string, date?: Date, setDate: (date?: Date) => void }) {
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
        />
      </PopoverContent>
    </Popover>
  )
}
