
'use client';

import { useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { EditCrewDialog } from "@/components/team/edit-crew-dialog";
import type { CrewMember, Shift, Project, ProjectCrewAssignment } from "@/lib/types";
import { useRouter } from "next/navigation";
import { UpdatePaymentDialog } from "@/components/team/update-payment-dialog";
import { PaymentsList } from "@/components/payments/payments-list";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface CrewMemberWithFinancials extends CrewMember {
  totalShifts: number;
  totalEarning: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  dailyWage: number;
  projectDesignation: string; // The designation for this specific role/row
}

export default function PaymentsPage() {
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));
  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));
  const { data: allShifts, isLoading: shiftsLoading } = useFirestoreQuery<Shift>(collection(db, "shifts"));
  
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const [paymentCrew, setPaymentCrew] = useState<CrewMemberWithFinancials | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (member: CrewMember) => {
    setEditingCrew(member);
  };
  
  const handleUpdatePayment = (member: CrewMemberWithFinancials) => {
    setPaymentCrew(member);
  }

  const handleDelete = (memberId: string) => {
    // This action should be disabled/removed from payments view
    toast({
      title: "Action Not Available",
      description: `Please remove crew members from the main Team page.`,
      variant: "default"
    });
  };
  
  const handleView = (member: CrewMember) => {
    router.push(`/team/${member.mid}`);
  }

  const crewWithProjectFinancials = useMemo((): CrewMemberWithFinancials[] => {
    if (!selectedProjectId || !allCrew || !allShifts) return [];

    const project = projects?.find(p => p.id === selectedProjectId);
    if (!project) return [];

    const projectShifts = allShifts.filter(s => s.projectId === selectedProjectId);
    
    // Each assignment in the project is a potential row in the payments list
    return project.crew.map(assignment => {
      // Find the master profile for the person
      const crewProfile = allCrew.find(c => c.id === assignment.crewId);
      if (!crewProfile) return null;

      // Filter shifts to only those for this specific role/assignment
      // This is crucial for correct financial calculation per role
      const memberShiftsForRole = projectShifts.filter(s => s.crewId === assignment.crewId && s.designation === assignment.designation);

      const totalShifts = memberShiftsForRole.reduce((acc, s) => acc + s.shiftDuration, 0);
      const totalEarning = memberShiftsForRole.reduce((acc, s) => acc + s.earnedAmount, 0);
      const totalPaid = memberShiftsForRole.reduce((acc, s) => acc + s.paidAmount, 0);
      const balance = totalEarning - totalPaid;

      let paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
      if (totalEarning > 0 && totalPaid >= totalEarning) {
        paymentStatus = 'Paid';
      } else if (totalPaid > 0 && totalPaid < totalEarning) {
        paymentStatus = 'Partially Paid';
      } else if (totalPaid === 0 && totalEarning > 0) {
        paymentStatus = 'Unpaid';
      } else {
        paymentStatus = 'Paid'; // Default for cases with 0 earnings
      }

      return {
        ...crewProfile, // Includes name, mid, avatar etc.
        totalShifts,
        totalEarning,
        totalPaid,
        balance,
        paymentStatus,
        dailyWage: assignment.dailyWage, // The correct project-specific wage
        projectDesignation: assignment.designation, // The correct project-specific designation
      };
    }).filter((m): m is CrewMemberWithFinancials => m !== null && m.totalShifts > 0);
  }, [allCrew, allShifts, selectedProjectId, projects]);

  const isLoading = projectsLoading || crewLoading || shiftsLoading;

  return (
    <div className="flex flex-col h-full gap-6">
      <PageHeader
        title="payments_title"
        description="payments_description"
      />
      
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={projectsLoading}>
            <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Select a Project" />
            </SelectTrigger>
            <SelectContent>
                {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
      
      <div className="flex-grow min-h-0">
        <PaymentsList 
          crewMembers={crewWithProjectFinancials}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onUpdatePayment={handleUpdatePayment}
          projectSelected={!!selectedProjectId}
          isLoading={isLoading}
        />
      </div>

      {editingCrew && (
        <EditCrewDialog
          key={editingCrew.id}
          crewMember={editingCrew}
          open={!!editingCrew}
          onOpenChange={(isOpen) => !isOpen && setEditingCrew(null)}
          onCrewUpdated={() => {
            // No direct refetch needed, data will update via onSnapshot
          }}
        />
      )}

      {paymentCrew && (
        <UpdatePaymentDialog
          key={`${paymentCrew.id}-${paymentCrew.projectDesignation}`}
          crewMember={paymentCrew}
          open={!!paymentCrew}
          onOpenChange={(isOpen) => !isOpen && setPaymentCrew(null)}
          projectId={selectedProjectId}
        />
      )}
    </div>
  )
}
