
"use client"

import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';

const ProjectReport = dynamic(
  () => import('@/components/reports/project-report').then(mod => mod.ProjectReport),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const CrewReport = dynamic(
  () => import('@/components/reports/crew-report').then(mod => mod.CrewReport),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);

const AttendanceReport = dynamic(
  () => import('@/components/reports/attendance-report').then(mod => mod.AttendanceReport),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> }
);


export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="reports_title"
        description="Generate and export detailed project, crew, and attendance reports."
      />
      <Tabs defaultValue="project" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="project">Project-wise</TabsTrigger>
          <TabsTrigger value="crew">Crew-wise</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="project">
          <ProjectReport />
        </TabsContent>
        <TabsContent value="crew">
          <CrewReport />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
