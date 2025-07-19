
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
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, type FormEvent, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "../ui/scroll-area"
import type { CrewMember, Designation, Project, ProjectCrewAssignment } from "@/lib/types";
import { collection, doc, updateDoc, arrayUnion, addDoc, query, where, getDocs, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"
import { Textarea } from "../ui/textarea"

type AddCrewDialogProps = {
  onCrewAdded: () => void;
}

export function AddCrewDialog({ onCrewAdded }: AddCrewDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast()
  const formRef = useRef<HTMLFormElement>(null);
  
  const { data: designations, isLoading: designationsLoading } = useFirestoreQuery<Designation>(
    query(collection(db, "designations"), orderBy("title"))
  );
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(
    query(collection(db, "projects"), orderBy("name"))
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("full-name") as string;
    const mobile = formData.get("mobile") as string;
    const designation = formData.get("designation") as string;
    const dailyWage = Number(formData.get("daily-wage"));
    const selectedProjectId = formData.get("project") as string;

    if (!name || !mobile || mobile.length < 4 || !designation || !dailyWage) {
        toast({
            variant: "destructive",
            title: "Invalid Input",
            description: "Please provide a valid name, designation, daily wage and a mobile number with at least 4 digits.",
        });
        setIsLoading(false);
        return;
    }

    const mid = `${name.substring(0, 4).toLowerCase().replace(/\s+/g, '')}${mobile.slice(-4)}`;

    try {
        // Every entry creates a new unique crew profile document.
        const newCrewMemberData: Omit<CrewMember, 'id'> = {
          mid: mid,
          name: name,
          mobile: mobile,
          email: formData.get("email") as string,
          address: formData.get("address") as string,
          designation: designation, // Master designation for this role profile
          notes: formData.get('notes') as string,
          avatar: "",
          dailyWage: dailyWage
        };
        
        const newDocRef = await addDoc(collection(db, 'crew'), newCrewMemberData);
        let toastDescription = `${name} has been added as ${designation}.`;

        // If a project is selected, assign this new, unique role to it.
        if (selectedProjectId && selectedProjectId !== 'none') {
            const projectRef = doc(db, "projects", selectedProjectId);
            const project = projects?.find(p => p.id === selectedProjectId);
            
            const newAssignment: ProjectCrewAssignment = { 
                crewId: newDocRef.id, // The ID of the newly created unique profile
                mid: mid, 
                designation: designation, // The designation for THIS project
                dailyWage: dailyWage // The wage for THIS project
            };

            await updateDoc(projectRef, {
                crew: arrayUnion(newAssignment)
            });
            toastDescription += ` They have been assigned to "${project?.name}" with a wage of ₹${dailyWage}.`;
        }

        toast({
          title: "Crew Role Created",
          description: toastDescription,
        });
        formRef.current?.reset();
        setOpen(false);
        onCrewAdded();
    } catch (error) {
        console.error("Error adding crew member role: ", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not add the crew member role. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Crew Role
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()} className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Crew Role</DialogTitle>
          <DialogDescription>
            Creates a new, unique profile for a crew member's specific role.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] p-1">
            <div className="grid gap-4 py-4 pr-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full-name" className="text-right">Full Name*</Label>
                <Input name="full-name" id="full-name" placeholder="e.g., Ramesh Kumar" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mobile" className="text-right">Mobile*</Label>
                <Input name="mobile" id="mobile" type="tel" placeholder="e.g., 9876543210" className="col-span-3" required/>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input name="email" id="email" type="email" placeholder="Optional email address" className="col-span-3" />
              </div>
               <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="address" className="text-right pt-2">Address</Label>
                <Textarea name="address" id="address" placeholder="Optional address" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Designation*</Label>
                <Select name="designation" required>
                    <SelectTrigger className="col-span-3" disabled={designationsLoading}>
                        <SelectValue placeholder="Select designation for this role" />
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
                <Input name="daily-wage" id="daily-wage" type="number" placeholder="Set wage for this specific role" className="col-span-3" required />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Assign Project</Label>
                <Select name="project">
                    <SelectTrigger className="col-span-3" disabled={projectsLoading}>
                        <SelectValue placeholder="Optional: Assign to a project" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects?.map((p) => (
                           <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="notes" className="text-right pt-2">Notes</Label>
                <Textarea name="notes" id="notes" placeholder="Optional notes for this crew role" className="col-span-3" />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
             <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || designationsLoading || projectsLoading}>{isLoading ? 'Saving...' : 'Save Role'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
