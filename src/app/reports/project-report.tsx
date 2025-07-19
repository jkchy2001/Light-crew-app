
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wallet, Users, BarChart } from "lucide-react"
import type { Project, CrewMember, Shift } from "@/lib/types"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"
import { db } from "@/lib/firebase"
import { collection, query, orderBy, where } from "firebase/firestore"
import { Loader } from "@/components/shared/loader"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import { format, parseISO } from 'date-fns'
import { cn } from "@/lib/utils"
import { ReportExportDialog } from "./report-export-dialog"

interface ProjectReportData {
  crewMember: CrewMember;
  totalShifts: number;
  totalEarning: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  designation: string;
  dailyWage: number;
}

export function ProjectReport() {
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const projectShiftsQuery = useMemo(() => {
    if (!selectedProjectId) return null;
    return query(collection(db, "shifts"), where("projectId", "==", selectedProjectId));
  }, [selectedProjectId]);

  const { data: projectShifts, isLoading: shiftsLoading } = useFirestoreQuery<Shift>(projectShiftsQuery);
  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));

  const selectedProject = useMemo(() => {
    return projects?.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const reportData = useMemo((): ProjectReportData[] => {
    if (!selectedProjectId || !allCrew || !projectShifts || !selectedProject) return [];
    
    const projectAssignments = selectedProject.crew;

    return projectAssignments
      .map(assignment => {
        const crewProfile = allCrew.find(c => c.id === assignment.crewId);
        if (!crewProfile) return null;

        const memberShifts = projectShifts.filter(s => s.crewId === assignment.crewId);
        
        const totalShifts = memberShifts.reduce((acc, s) => acc + s.shiftDuration, 0);
        const totalEarning = memberShifts.reduce((acc, s) => acc + s.earnedAmount, 0);
        const totalPaid = memberShifts.reduce((acc, s) => acc + s.paidAmount, 0);
        const balance = totalEarning - totalPaid;

        let paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
        if (totalEarning > 0 && balance <= 0) {
          paymentStatus = 'Paid';
        } else if (totalPaid > 0 && totalPaid < totalEarning) {
          paymentStatus = 'Partially Paid';
        } else if (totalPaid === 0 && totalEarning > 0) {
            paymentStatus = 'Unpaid';
        } else {
            paymentStatus = 'Paid'; // Default for cases with 0 earnings
        }
        
        return {
          crewMember: crewProfile,
          designation: assignment.designation,
          dailyWage: assignment.dailyWage,
          totalShifts,
          totalEarning,
          totalPaid,
          balance,
          paymentStatus,
        };
      })
      .filter((item): item is ProjectReportData => item !== null && item.totalShifts > 0)
      .sort((a,b) => a.crewMember.name.localeCompare(b.crewMember.name));

  }, [selectedProjectId, allCrew, projectShifts, selectedProject]);
  
  const summary = useMemo(() => {
      if (!reportData) return { totalEarning: 0, totalPaid: 0, balance: 0, crewCount: 0 };
      const crewCount = reportData.length;
      const totalEarning = reportData.reduce((acc, row) => acc + row.totalEarning, 0);
      const totalPaid = reportData.reduce((acc, row) => acc + row.totalPaid, 0);
      const balance = totalEarning - totalPaid;
      return { totalEarning, totalPaid, balance, crewCount };
  }, [reportData]);

  const isLoading = projectsLoading || (selectedProjectId && (shiftsLoading || crewLoading));

  const designationColors: { [key: string]: string } = {
    'DOP': '#E9F7EF',
    'Gaffer': '#FEF3E6',
    'Best Boy': '#F0F5FF',
    'Asst. Cameraman': '#FDF2FA',
    'Grip': '#F4F4F5'
  };
  const defaultRowColor = '#FFFFFF';

  const handleExport = (formatType: 'pdf' | 'excel', selectedIds: string[]) => {
    if (formatType === 'pdf') {
      handleExportPDF(reportData);
    } else {
      handleExportExcel(reportData);
    }
  };

  const generateFileName = () => {
    if (!selectedProject) return `Project_Report_${format(new Date(), 'ddMMMyyyy')}`;
    return `Project_Report_${selectedProject.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMMyyyy')}`;
  }


  const handleExportPDF = (dataToExport: ProjectReportData[]) => {
    if (!selectedProject || dataToExport.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });

    const exportTime = format(new Date(), 'PPP p');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedProject.name, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client: ${selectedProject.client || 'N/A'} | Location: ${selectedProject.location || 'N/A'}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    
    const startDate = selectedProject.startDate ? format(parseISO(selectedProject.startDate), 'dd MMM yyyy') : 'N/A';
    const endDate = selectedProject.endDate ? format(parseISO(selectedProject.endDate), 'dd MMM yyyy') : 'N/A';
    doc.text(`Dates: ${startDate} to ${endDate}`, doc.internal.pageSize.getWidth() / 2, 34, { align: 'center' });

    doc.text(`DOP: ${selectedProject.dop || 'N/A'} | Gaffer: ${selectedProject.gaffer || 'N/A'} | Crew Count: ${summary.crewCount}`, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });

    const tableData = dataToExport.map((row, index) => [
      index + 1,
      row.crewMember.name,
      row.designation,
      row.totalShifts.toFixed(2),
      `Rs. ${(row.dailyWage || 0).toLocaleString()}`,
      `Rs. ${row.totalEarning.toLocaleString()}`,
      `Rs. ${row.totalPaid.toLocaleString()}`,
      `Rs. ${row.balance.toLocaleString()}`,
      row.paymentStatus,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Sr. No.', 'Crew Name', 'Designation', 'Total Shifts', 'Rate/Day', 'Total Earning', 'Total Paid', 'Balance', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: '#0A0F1E', textColor: 255, fontStyle: 'bold' },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.cell.raw !== undefined) {
            const designation = data.row.raw[2] as string;
            const color = designationColors[designation] || defaultRowColor;
            doc.setFillColor(color);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.text(String(data.cell.raw), data.cell.x + 2, data.cell.y + data.cell.height / 2, {
                valign: 'middle'
            });
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Exported on: ${exportTime}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, doc.internal.pageSize.getWidth() - data.settings.margin.right, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      }
    });
    
    doc.save(`${generateFileName()}.pdf`);
  };

  const handleExportExcel = (dataToExport: ProjectReportData[]) => {
    if (!selectedProject || dataToExport.length === 0) return;
    
    const exportTime = format(new Date(), 'PPP p');
    const startDate = selectedProject.startDate ? format(parseISO(selectedProject.startDate), 'dd MMM yyyy') : 'N/A';
    const endDate = selectedProject.endDate ? format(parseISO(selectedProject.endDate), 'dd MMM yyyy') : 'N/A';

    const header = [
        ["Project Report"],
        [selectedProject.name],
        [`Client: ${selectedProject.client || 'N/A'}`, `Location: ${selectedProject.location || 'N/A'}`],
        [`Dates: ${startDate} to ${endDate}`],
        [`DOP: ${selectedProject.dop || 'N/A'}`, `Gaffer: ${selectedProject.gaffer || 'N/A'}`, `Crew Count: ${summary.crewCount}`],
        [`Exported on: ${exportTime}`],
        [] // Blank row
    ];

    const tableHeader = ['Sr. No.', 'Crew Name', 'Designation', 'Total Shifts', 'Rate/Day (INR)', 'Total Earning (INR)', 'Total Paid (INR)', 'Balance (INR)', 'Payment Status'];
    const tableBody = dataToExport.map((row, index) => ([
      index + 1,
      row.crewMember.name,
      row.designation,
      row.totalShifts.toFixed(2),
      row.dailyWage || 0,
      row.totalEarning,
      row.totalPaid,
      row.balance,
      row.paymentStatus,
    ]));

    const worksheetData = [
        ...header,
        tableHeader,
        ...tableBody
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Merge for main title
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Merge for project name
    ];
    worksheet['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
    worksheet['A2'].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };
    
    XLSX.writeFile(workbook, `${generateFileName()}.xlsx`);
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" | null | undefined => {
    switch (status) {
      case "Paid": return "default";
      case "Partially Paid": return "secondary";
      case "Unpaid": return "destructive";
      default: return "outline";
    }
  }

  const getRowColor = (designation: string) => {
      if (designation === 'DOP') return 'bg-primary/10';
      if (designation === 'Gaffer') return 'bg-accent/10';
      return 'hover:bg-muted/30';
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex-grow">
              <CardTitle className="font-bold">Project-wise Report</CardTitle>
              <CardDescription>Select a project to view its financial summary.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={projectsLoading}>
              <SelectTrigger className="w-full sm:w-[240px]">
                  <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <ReportExportDialog
                options={[]}
                onExport={handleExport}
                disabled={!selectedProjectId || reportData.length === 0}
                requireSelection={false}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96"><Loader text="Generating Project Report..." /></div>
        ) : selectedProjectId ? (
          reportData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <SummaryCard title="Total Crew Roles" value={summary.crewCount.toString()} icon={Users} />
                <SummaryCard title="Total Earnings" value={`₹${summary.totalEarning.toLocaleString()}`} icon={Wallet} />
                <SummaryCard title="Total Paid" value={`₹${summary.totalPaid.toLocaleString()}`} icon={Wallet} color="text-green-500" />
                <SummaryCard title="Total Balance" value={`₹${summary.balance.toLocaleString()}`} icon={Wallet} color="text-red-500" />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Crew Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Total Shifts</TableHead>
                      <TableHead>Rate/Day</TableHead>
                      <TableHead>Total Earning</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.map((row) => (
                      <TableRow key={`${row.crewMember.id}-${row.designation}`} className={getRowColor(row.designation)}>
                        <TableCell className="font-medium">{row.crewMember.name}</TableCell>
                        <TableCell>{row.designation}</TableCell>
                        <TableCell>{row.totalShifts.toFixed(2)}</TableCell>
                        <TableCell>₹{(row.dailyWage || 0).toLocaleString()}</TableCell>
                        <TableCell>₹{row.totalEarning.toLocaleString()}</TableCell>
                        <TableCell>₹{row.totalPaid.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">₹{row.balance.toLocaleString()}</TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(row.paymentStatus)}>{row.paymentStatus}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Report Data</h3>
                <p className="mt-1 text-sm text-muted-foreground">No shifts have been logged for this project yet.</p>
            </div>
          )
        ) : (
           <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Select a Project</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a project from the dropdown to generate a report.</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: React.ElementType, color?: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={cn("text-2xl font-bold", color)}>{value}</div>
            </CardContent>
        </Card>
    );
}
