
'use client';

import { useRouter, useParams } from 'next/navigation';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Phone, Briefcase, UserCircle, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { Shift, Project, CrewMember } from '@/lib/types';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader } from '@/components/shared/loader';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ProjectFinancials {
  project: Project;
  totalShifts: number;
  totalEarning: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  designation: string;
  dailyWage: number;
  assignmentKey: string; // Unique key for the table row
}

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

export default function CrewDetailPage() {
  const params = useParams();
  const mid = params.id as string; // This is now the MID
  const router = useRouter();

  const crewQuery = useMemo(() => {
    if (!mid) return null;
    return query(collection(db, 'crew'), where('mid', '==', mid));
  }, [mid]);
  
  const { data: crewProfiles, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(crewQuery);
  const representativeProfile = useMemo(() => crewProfiles?.[0], [crewProfiles]);

  const shiftsQuery = useMemo(() => {
      if (!mid) return null;
      return query(collection(db, 'shifts'), where('mid', '==', mid));
  }, [mid]);

  const { data: shifts, isLoading: shiftsLoading } = useFirestoreQuery<Shift>(shiftsQuery);
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, 'projects')));


  const projectFinancials = useMemo((): ProjectFinancials[] => {
    if (!representativeProfile || !shifts || !projects) return [];

    const financials: ProjectFinancials[] = [];

    // Iterate through all projects
    for (const project of projects) {
        // Find all roles this person has in this specific project
        const assignmentsInProject = project.crew.filter(c => c.mid === mid);

        // For each role, calculate financials separately
        for (const assignment of assignmentsInProject) {
            // Filter shifts to only those for this specific person, project, AND designation
            const shiftsForRole = shifts.filter(s => 
                s.projectId === project.id && 
                s.crewId === assignment.crewId // Match the unique profile ID for this role
            );

            // If there are no shifts for this role, don't create a row
            if (shiftsForRole.length === 0) continue;
            
            const totalShifts = shiftsForRole.reduce((acc, s) => acc + s.shiftDuration, 0);
            const totalEarning = shiftsForRole.reduce((acc, s) => acc + s.earnedAmount, 0);
            const totalPaid = shiftsForRole.reduce((acc, s) => acc + s.paidAmount, 0);
            const balance = totalEarning - totalPaid;

            let paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
            if (totalEarning === 0 && totalPaid === 0) {
              paymentStatus = 'Paid';
            } else if (totalPaid === 0) {
              paymentStatus = 'Unpaid';
            } else if (balance <= 0) {
              paymentStatus = 'Paid';
            } else {
              paymentStatus = 'Partially Paid';
            }

            financials.push({
              project,
              totalShifts,
              totalEarning,
              totalPaid,
              balance,
              paymentStatus,
              designation: assignment.designation,
              dailyWage: assignment.dailyWage,
              assignmentKey: `${project.id}-${assignment.crewId}` // Unique key for this row
            });
        }
    }

    return financials.sort((a,b) => new Date(b.project.startDate).getTime() - new Date(a.project.startDate).getTime());
  }, [representativeProfile, shifts, projects, mid]);

  const isLoading = crewLoading || shiftsLoading || projectsLoading;

  if (isLoading) {
    return <Loader text="Loading Financial Summary..." />;
  }

  if (!representativeProfile) {
    return (
        <div className="text-center py-16">
            <h1 className="text-2xl font-bold">Crew Member Not Found</h1>
            <p className="text-muted-foreground">The crew member you are looking for does not exist.</p>
            <Button onClick={() => router.push('/team')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Team
            </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={representativeProfile.avatar || undefined} alt={representativeProfile.name} data-ai-hint="person portrait"/>
                    <AvatarFallback>{getInitials(representativeProfile.name)}</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{representativeProfile.name}</h1>
                    <p className="text-muted-foreground">Financial Summary</p>
                </div>
            </div>
        </div>

        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                 <div className="flex items-center gap-3">
                    <UserCircle className="h-5 w-5 text-accent" />
                    <span>Member ID: {representativeProfile.mid}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-accent" />
                    <span>{representativeProfile.mobile}</span>
                </div>
            </CardContent>
        </Card>

        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Project-wise Financial Summary</CardTitle>
                <CardDescription>Breakdown of earnings, payments, and balance for each project role.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="max-h-[60vh]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {projectFinancials.length > 0 ? projectFinancials.map(pf => (
                            <Card key={pf.assignmentKey} className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-lg">{pf.project.name}</CardTitle>
                                    <CardDescription>{pf.designation}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <p className="flex justify-between"><span>Total Shifts:</span> <span className="font-medium">{pf.totalShifts.toFixed(2)}</span></p>
                                    <p className="flex justify-between"><span>Rate/Day:</span> <span className="font-medium">₹{pf.dailyWage.toLocaleString()}</span></p>
                                    <p className="flex justify-between"><span>Total Earning:</span> <span className="font-medium">₹{pf.totalEarning.toLocaleString()}</span></p>
                                    <p className="flex justify-between"><span>Total Paid:</span> <span className="font-medium">₹{pf.totalPaid.toLocaleString()}</span></p>
                                    <p className="flex justify-between font-semibold text-base"><span>Balance:</span> <span>₹{pf.balance.toLocaleString()}</span></p>
                                </CardContent>
                                <CardFooter>
                                     <Badge variant={getStatusBadgeVariant(pf.paymentStatus)}>{pf.paymentStatus}</Badge>
                                </CardFooter>
                            </Card>
                        )) : (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg col-span-full">
                                <h2 className="text-xl font-semibold text-muted-foreground">No Project Data</h2>
                                <p className="text-muted-foreground">This crew member has not logged any shifts yet.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
