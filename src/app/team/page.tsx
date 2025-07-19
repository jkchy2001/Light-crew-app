
'use client';

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { AddCrewDialog } from "@/components/team/add-crew-dialog";
import { TeamList } from "@/components/team/team-list";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EditCrewDialog } from "@/components/team/edit-crew-dialog";
import type { CrewMember, Project, ProjectCrewAssignment } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, query, orderBy, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// A new type to represent a hydrated assignment for the list
export interface HydratedCrewAssignment extends CrewMember {
  projectName: string;
  projectId: string;
  projectDesignation: string;
  projectDailyWage: number;
}

export default function TeamPage() {
  const { data: allCrew, isLoading: crewLoading, refetch: refetchCrew } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));
  
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (member: CrewMember) => {
    setEditingCrew(member);
  };

  const handleDelete = async (memberId: string) => {
    const memberToDelete = allCrew?.find(m => m.id === memberId);
    if (!memberToDelete) return;
    
    const batch = writeBatch(db);

    const crewDocRef = doc(db, "crew", memberId);
    batch.delete(crewDocRef);

    if(projects) {
        for (const project of projects) {
            if (project.crew.some(c => c.crewId === memberId)) {
                const updatedCrew = project.crew.filter(c => c.crewId !== memberId);
                const projectDocRef = doc(db, "projects", project.id);
                batch.update(projectDocRef, { crew: updatedCrew });
            }
        }
    }
    
    try {
      await batch.commit();
      toast({
        title: "Crew Role Deleted",
        description: `The role "${memberToDelete.designation}" for ${memberToDelete.name} has been removed from the system and all project assignments.`,
        variant: "destructive"
      });
      refetchCrew();
      refetchProjects();
    } catch (error) {
       console.error("Error deleting crew member role:", error);
       toast({
         title: "Error",
         description: "Could not delete crew member role. Please try again.",
         variant: "destructive"
       });
    }
  };
  
  const handleView = (member: CrewMember) => {
    router.push(`/team/${member.mid}`);
  }

  const hydratedAssignments = useMemo((): HydratedCrewAssignment[] => {
    if (!projects || !allCrew) return [];

    const assignments: HydratedCrewAssignment[] = [];
    
    const projectsToProcess = selectedProjectId 
        ? projects.filter(p => p.id === selectedProjectId)
        : projects;

    for (const project of projectsToProcess) {
        for (const assignment of project.crew) {
            const crewMember = allCrew.find(c => c.id === assignment.crewId);
            if (crewMember) {
                assignments.push({
                    ...crewMember,
                    projectName: project.name,
                    projectId: project.id,
                    projectDesignation: assignment.designation,
                    projectDailyWage: assignment.dailyWage,
                });
            }
        }
    }
    
    return assignments;
  }, [allCrew, projects, selectedProjectId]);


  const filteredAssignments = useMemo((): HydratedCrewAssignment[] => {
    if (!hydratedAssignments) return [];

    if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        return hydratedAssignments.filter(assignment => 
            assignment.name.toLowerCase().includes(lowercasedQuery) ||
            assignment.projectDesignation.toLowerCase().includes(lowercasedQuery) ||
            assignment.mid.toLowerCase().includes(lowercasedQuery) ||
            assignment.projectName.toLowerCase().includes(lowercasedQuery)
        );
    }
    
    return hydratedAssignments;
  }, [hydratedAssignments, searchQuery]);


  const isLoading = crewLoading || projectsLoading;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="team_title"
        description="team_description"
      >
        <AddCrewDialog onCrewAdded={() => { refetchCrew(); refetchProjects(); }} />
      </PageHeader>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative w-full md:w-auto md:flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, role, project, MID..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <Select onValueChange={(value) => setSelectedProjectId(value === "all" ? "" : value)} value={selectedProjectId || "all"} disabled={projectsLoading}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Filter by Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-grow min-h-0">
        <TeamList 
          crewAssignments={filteredAssignments}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          isLoading={isLoading}
        />
      </div>

      {editingCrew && (
        <EditCrewDialog
          key={editingCrew.id}
          crewMember={editingCrew}
          open={!!editingCrew}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingCrew(null);
            }
          }}
          onCrewUpdated={refetchCrew}
        />
      )}
    </div>
  )
}
