
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, Eye, DollarSign } from "lucide-react"
import { Badge } from "../ui/badge"
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
import { Loader } from "@/components/shared/loader"
import { ScrollArea } from "../ui/scroll-area"

interface CrewMemberWithFinancials extends CrewMember {
  totalShifts: number;
  totalEarning: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  dailyWage: number;
  projectDesignation: string; // The designation for this specific role/row
}


type PaymentsListProps = {
  crewMembers: CrewMemberWithFinancials[];
  onEdit: (member: CrewMember) => void;
  onDelete: (memberId: string) => void;
  onView: (member: CrewMember) => void;
  onUpdatePayment: (member: CrewMemberWithFinancials) => void;
  projectSelected: boolean;
  isLoading: boolean;
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch (status) {
      case "Paid": return "default";
      case "Unpaid": return "destructive";
      case "Partially Paid": return "secondary";
      default: return "outline";
    }
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return '??';
    const names = name.split(' ').filter(Boolean);
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


export function PaymentsList({ crewMembers, onEdit, onDelete, onView, onUpdatePayment, projectSelected, isLoading }: PaymentsListProps) {

  if (!projectSelected) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold text-muted-foreground">Please Select a Project</h2>
            <p className="text-muted-foreground">Crew payment details will appear here once you select a project.</p>
        </div>
    )
  }

  if (isLoading) {
      return (
        <div className="h-full w-full">
            <Loader text="Fetching Payment Data..." />
        </div>
      )
  }

  if (crewMembers.length === 0) {
    return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold text-muted-foreground">No Crew Members Found</h2>
            <p className="text-muted-foreground">No crew members have recorded shifts for this project.</p>
        </div>
    )
  }

  return (
    <ScrollArea className="h-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-1">
            {crewMembers.map((member) => (
                <Card key={`${member.id}-${member.projectDesignation}`} className="glass-card flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <Avatar>
                                    <AvatarImage src={member.avatar || undefined} alt={member.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="truncate">{member.name}</CardTitle>
                                    <CardDescription className="truncate">{member.projectDesignation}</CardDescription>
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
                                    <DropdownMenuItem onSelect={() => onUpdatePayment(member)} disabled={member.balance <= 0}>
                                        <DollarSign className="mr-2 h-4 w-4" />
                                        Update Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onView(member)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => onEdit(member)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Profile
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Role
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the "{member.projectDesignation}" role for {member.name}.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(member.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2 text-sm">
                        <p className="text-muted-foreground">Total Earning: <span className="font-medium text-foreground">₹{member.totalEarning.toLocaleString()}</span></p>
                        <p className="text-muted-foreground">Total Paid: <span className="font-medium text-foreground">₹{member.totalPaid.toLocaleString()}</span></p>
                        <p className="font-semibold">Balance: <span className="text-lg text-primary">₹{member.balance.toLocaleString()}</span></p>
                    </CardContent>
                    <CardFooter>
                        <Badge variant={getStatusBadgeVariant(member.paymentStatus)}>{member.paymentStatus}</Badge>
                    </CardFooter>
                </Card>
            ))}
        </div>
    </ScrollArea>
  )
}
