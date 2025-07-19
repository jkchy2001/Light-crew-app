
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
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
import type { CrewMember } from "@/lib/types"
import type { HydratedCrewAssignment } from "@/app/team/page"
import { Loader } from "@/components/shared/loader"
import { ScrollArea } from "../ui/scroll-area"
import { Badge } from "../ui/badge"

type TeamListProps = {
  crewAssignments: HydratedCrewAssignment[];
  onEdit: (member: CrewMember) => void;
  onDelete: (memberId: string) => void;
  onView: (member: CrewMember) => void;
  isLoading: boolean;
};

const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function TeamList({ crewAssignments, onEdit, onDelete, onView, isLoading }: TeamListProps) {

  if (isLoading) {
    return (
        <div className="h-full w-full">
            <Loader text="Loading Team Roster..." />
        </div>
    )
  }

  if (crewAssignments.length === 0) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold text-muted-foreground">No Crew Roles Found</h2>
            <p className="text-muted-foreground">Try adjusting your filters or add a new crew role.</p>
        </div>
    )
  }

  return (
    <ScrollArea className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
            {crewAssignments.map((assignment) => (
                <Card key={assignment.id} className="glass-card flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                    <AvatarImage src={assignment.avatar || undefined} alt={assignment.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{getInitials(assignment.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="truncate">{assignment.name}</CardTitle>
                                    <CardDescription className="truncate">{assignment.projectDesignation}</CardDescription>
                                </div>
                            </div>

                             <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                     <Button variant="ghost" size="icon" className="flex-shrink-0 -mt-2 -mr-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                     </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => onView(assignment)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Financials
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onEdit(assignment)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit This Role
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete This Role
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the "{assignment.designation}" role for {assignment.name}. This will also remove them from any projects they were assigned to in this role.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(assignment.id)}>Delete Role</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <Badge variant="secondary" className="bg-gradient-to-tr from-purple-500 to-pink-500 text-white border-pink-600 shadow-md mb-2">{assignment.projectName}</Badge>
                       <p className="text-muted-foreground">Mobile: <span className="font-medium text-foreground">{assignment.mobile}</span></p>
                       <p className="text-muted-foreground">Wage: <span className="font-medium text-foreground">₹{(assignment.projectDailyWage || 0).toLocaleString()}</span></p>
                    </CardContent>
                    <CardFooter>
                         <div className="font-mono text-xs bg-muted/80 px-2 py-1 rounded w-fit">{assignment.mid}</div>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </ScrollArea>
  )
}
