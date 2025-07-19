
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { useState, type FormEvent, useEffect, useMemo } from "react"
import { useToast } from "@/hooks/use-toast"
import type { Project, CrewMember, ProjectCrewAssignment } from "@/lib/types"
import { doc, updateDoc, collection, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"

type EditProjectDialogProps = {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [locations, setLocations] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedDopId, setSelectedDopId] = useState('');
  const [selectedGafferId, setSelectedGafferId] = useState('');
  const [selectedBestBoyId, setSelectedBestBoyId] = useState('');
  const [assignedCrew, setAssignedCrew] = useState<ProjectCrewAssignment[]>([]);
  
  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));

  const dops = useMemo(() => allCrew?.filter(c => c.designation.toLowerCase() === 'dop') || [], [allCrew]);
  const gaffers = useMemo(() => allCrew?.filter(c => c.designation.toLowerCase() === 'gaffer') || [], [allCrew]);
  const bestBoys = useMemo(() => allCrew?.filter(c => c.designation.toLowerCase().includes('best boy')) || [], [allCrew]);


  useEffect(() => {
    if (project && allCrew) {
        setName(project.name);
        setClient(project.client || '');
        setDescription(project.description || '');
        setStatus(project.status);
        setLocations(project.location);
        setNotes(project.notes || '');
        
        setStartDate(project.startDate ? parseISO(project.startDate) : undefined);
        setEndDate(project.endDate ? parseISO(project.endDate) : undefined);
        setAssignedCrew(project.crew || []);

        const dop = allCrew.find(c => c.name === project.dop && c.designation.toLowerCase() === 'dop');
        const gaffer = allCrew.find(c => c.name === project.gaffer && c.designation.toLowerCase() === 'gaffer');
        const bestBoy = allCrew.find(c => c.name === project.bestBoy && c.designation.toLowerCase().includes('best boy'));
        
        setSelectedDopId(dop?.id || '');
        setSelectedGafferId(gaffer?.id || '');
        setSelectedBestBoyId(bestBoy?.id || '');
    }
  }, [project, allCrew, open]);

  useEffect(() => {
    const newAssignments: ProjectCrewAssignment[] = [];
    const addedMids = new Set<string>();

    const addAssignment = (crewId: string) => {
      if (!crewId) return;
      
      const existingAssignment = project.crew.find(c => c.crewId === crewId);
      const member = allCrew?.find(c => c.id === crewId);

      if (member && !addedMids.has(member.mid)) {
        newAssignments.push({
          crewId: member.id,
          mid: member.mid,
          designation: member.designation,
          dailyWage: existingAssignment?.dailyWage || member.dailyWage || 0,
        });
        addedMids.add(member.mid);
      }
    };

    addAssignment(selectedDopId);
    addAssignment(selectedGafferId);
    addAssignment(selectedBestBoyId);
    
    // Keep other manually added crew
    const otherCrew = project.crew.filter(c => !addedMids.has(c.mid));
    
    setAssignedCrew([...newAssignments, ...otherCrew]);

  }, [selectedDopId, selectedGafferId, selectedBestBoyId, allCrew, project.crew]);

  
   const handleWageChange = (crewId: string, newWage: number) => {
      setAssignedCrew(prev => prev.map(c => c.crewId === crewId ? { ...c, dailyWage: newWage } : c));
  }


  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const dop = allCrew?.find(c => c.id === selectedDopId);
    const gaffer = allCrew?.find(c => c.id === selectedGafferId);
    const bestBoy = allCrew?.find(c => c.id === selectedBestBoyId);

    const projectRef = doc(db, "projects", project.id);

    const updatedData: Partial<Project> = {
      name,
      client,
      description,
      status,
      dop: dop?.name || '',
      gaffer: gaffer?.name || '',
      bestBoy: bestBoy?.name || '',
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : "",
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : "",
      location: locations,
      crew: assignedCrew,
      notes,
    };

    try {
      await updateDoc(projectRef, updatedData);
      toast({
        title: "Project Updated",
        description: `"${updatedData.name}" has been successfully updated.`,
      })
      onOpenChange(false);
    } catch(error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Could not update project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  const dataIsLoading = crewLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update the details for this project. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto pr-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Project Name*</Label>
                <Input id="name" name="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="client" className="text-right">Client Name</Label>
                <Input id="client" name="client" value={client} onChange={e => setClient(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <Textarea id="description" name="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status*</Label>
                  <Select name="status" required value={status} onValueChange={setStatus}>
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
                <Input id="locations" name="locations" value={locations} onChange={e => setLocations(e.target.value)} placeholder="Mumbai, Delhi, Goa (comma-separated)" className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <Textarea id="notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional project notes..." className="col-span-3" />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || dataIsLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</Button>
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
