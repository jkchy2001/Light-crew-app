
'use client';

import { PageHeader } from "@/components/shared/page-header"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { ProjectList } from "@/components/projects/project-list"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditProjectDialog } from "@/components/projects/edit-project-dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Project } from "@/lib/types";
import { useLanguage } from "@/hooks/use-language";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("startDate", "desc")));
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const handleEdit = (project: Project) => {
    setEditingProject(project);
  };

  const handleDelete = async (projectId: string) => {
    const projectToDelete = projects?.find(p => p.id === projectId);
    if (!projectToDelete) return;

    try {
      await deleteDoc(doc(db, "projects", projectId));
      toast({
        title: t('project_deleted_title'),
        description: `"${projectToDelete.name}" ${t('has_been_removed_desc')}`,
        variant: "destructive"
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: t('error_title'),
        description: t('could_not_delete_project_desc'),
        variant: "destructive"
      });
    }
  };

  const handleView = (project: Project) => {
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="projects_title"
        description="projects_description"
      >
        <CreateProjectDialog />
      </PageHeader>
      
      <div className="flex-grow min-h-0">
        <ProjectList 
          projects={projects || []} 
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          isLoading={isLoading}
        />
      </div>


      {editingProject && (
        <EditProjectDialog
          key={editingProject.id}
          project={editingProject}
          open={!!editingProject}
          onOpenChange={(isOpen) => !isOpen && setEditingProject(null)}
        />
      )}
    </div>
  )
}
