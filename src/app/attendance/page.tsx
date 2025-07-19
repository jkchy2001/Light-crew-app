
'use client';

import { PageHeader } from "@/components/shared/page-header"
import { AddShiftDialog } from "@/components/attendance/add-shift-dialog"
import { useState, useMemo } from "react"
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, query, orderBy, deleteDoc, doc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Shift, Project, CrewMember } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar";
import { ShiftDetailView } from "@/components/attendance/shift-detail-view";
import { Card, CardContent } from "@/components/ui/card";
import { EditShiftDialog } from "@/components/attendance/edit-shift-dialog";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AttendancePage() {
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));
  const { data: crew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));
  const { data: shifts, isLoading: shiftsLoading, refetch: refetchShifts } = useFirestoreQuery<Shift>(collection(db, 'shifts'));
  const { toast } = useToast();

  const [addDialogKey, setAddDialogKey] = useState(0); 
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedCrewRoleId, setSelectedCrewRoleId] = useState<string>(''); // This will be the Firestore Doc ID of the crew profile
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const project = useMemo(() => projects?.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
  const crewMemberRole = useMemo(() => crew?.find(c => c.id === selectedCrewRoleId), [crew, selectedCrewRoleId]);
  
  const selectedShift = useMemo(() => {
    if (!selectedDate || !crewMemberRole || !project) return null;
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return shifts?.find(s => 
        s.crewId === selectedCrewRoleId && 
        s.projectId === selectedProjectId && 
        s.date === dateString
    ) || null;
  }, [shifts, selectedDate, selectedCrewRoleId, selectedProjectId, crewMemberRole, project]);

  const availableCrewForProject = useMemo(() => {
    if (!project || !crew) return [];
    const projectCrewIds = new Set(project.crew.map(c => c.crewId));
    return crew.filter(c => projectCrewIds.has(c.id));
  }, [project, crew]);

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedCrewRoleId(''); // Reset crew member when project changes
    setSelectedDate(null); // Reset date view
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  }

  const handleBackToCalendar = () => {
    setSelectedDate(null);
  }
  
  const handleEditClick = (shift: Shift) => {
    if (shift) {
        setEditingShift(shift);
    }
  }

  const handleDeleteShift = async () => {
    if (!selectedShift) return;
    try {
      await deleteDoc(doc(db, "shifts", selectedShift.id));
      toast({
        title: "Shift Deleted",
        description: `The shift on ${selectedShift.date} has been removed.`,
        variant: "destructive",
      });
      handleBackToCalendar(); // Go back to calendar view
      refetchShifts();
    } catch (error) {
      console.error("Error deleting shift:", error);
      toast({
        title: "Error",
        description: "Could not delete the shift. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleShiftAddedOrUpdated = () => {
    refetchShifts();
    setAddDialogKey(prev => prev + 1); 
    if (editingShift) setEditingShift(null);
  }

  const isLoading = projectsLoading || crewLoading || shiftsLoading;

  return (
    <div className="space-y-6">
      <PageHeader
        title="attendance_title"
        description="attendance_description"
      >
        <AddShiftDialog 
          key={addDialogKey} 
          onShiftAdded={handleShiftAddedOrUpdated} 
        />
      </PageHeader>
      
      <div className="flex flex-col md:flex-row gap-4">
        <Select onValueChange={handleProjectChange} value={selectedProjectId} disabled={projectsLoading}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Select a Project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select onValueChange={setSelectedCrewRoleId} value={selectedCrewRoleId} disabled={!selectedProjectId || crewLoading}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Select a Crew Member Role" />
          </SelectTrigger>
          <SelectContent>
            {availableCrewForProject.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.designation})</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedCrewRoleId && project ? (
        selectedDate ? (
          <div>
            <ShiftDetailView 
              shift={selectedShift}
              crewMember={crewMemberRole!}
              project={project}
              date={selectedDate}
              onBack={handleBackToCalendar}
              onEdit={handleEditClick}
              onDelete={handleDeleteShift}
            />
          </div>
        ) : (
          <Card className="glass-card">
            <CardContent className="p-2 md:p-6">
              <AttendanceCalendar
                shifts={shifts || []}
                selectedCrewRoleId={selectedCrewRoleId}
                selectedProjectId={selectedProjectId}
                onDateClick={handleDateClick}
              />
            </CardContent>
          </Card>
        )
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold text-muted-foreground">Please select a project and crew member role.</h2>
          <p className="text-muted-foreground">Their attendance calendar will appear here.</p>
        </div>
      )}

      {editingShift && (
        <EditShiftDialog 
          shift={editingShift}
          open={!!editingShift}
          onOpenChange={(isOpen) => !isOpen && setEditingShift(null)}
          onShiftUpdated={handleShiftAddedOrUpdated}
        />
      )}
    </div>
  )
}
