
"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, Eye, Pencil, Trash2, Calendar, User, Users, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader } from "@/components/shared/loader"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { Project } from "@/lib/types";
import { format } from "date-fns";
import { useLanguage } from "@/hooks/use-language";

type ProjectListProps = {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  onView: (project: Project) => void;
  isLoading: boolean;
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch(status) {
        case "Ongoing": return "default";
        case "Upcoming": return "secondary";
        case "Completed": return "outline";
        default: return "default";
    }
}

export function ProjectList({ projects, onEdit, onDelete, onView, isLoading }: ProjectListProps) {
  const { t } = useLanguage();
  if (isLoading) {
    return (
      <div className="h-full w-full">
        <Loader text={t('loading_projects_text')} />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
          <h2 className="text-xl font-semibold text-muted-foreground">{t('no_projects_found_title')}</h2>
          <p className="text-muted-foreground">{t('add_project_to_start_text')}</p>
      </div>
    )
  }
  
  return (
    <ScrollArea className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
            {projects.map((project) => (
                <Card key={project.id} className="glass-card flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <CardTitle className="leading-tight">{project.name}</CardTitle>
                                <CardDescription>{project.client || "N/A"}</CardDescription>
                            </div>
                             <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-2 -mr-2">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(project)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        {t('view_button_text')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit(project)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        {t('edit_button_text')}
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            {t('delete_button_text')}
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>{t('are_you_sure_title')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                       {t('delete_project_warning_desc')} "{project.name}".
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(project.id)}>{t('delete_button_text')}</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div className="text-sm text-muted-foreground space-y-2">
                           <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {project.startDate ? format(new Date(project.startDate), "dd MMM yyyy") : 'N/A'} - {project.endDate ? format(new Date(project.endDate), "dd MMM yyyy") : 'N/A'}
                                </span>
                           </div>
                           <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{project.location || 'N/A'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>DOP: {project.dop || 'N/A'}</span>
                           </div>
                           <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{t('crew_label')} {project.crew.length} {t('assigned_suffix')}</span>
                           </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Badge variant={getStatusBadgeVariant(project.status)}>{project.status}</Badge>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </ScrollArea>
  )
}

      