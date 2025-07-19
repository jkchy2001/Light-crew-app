
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Wallet, BarChart, Briefcase } from "lucide-react"
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
import { ScrollArea } from "../ui/scroll-area"

interface CrewReportData {
  project: Project;
  designation: string;
  dailyWage: number;
  totalShifts: number;
  totalEarning: number;
  totalPaid: number;
  balance: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partially Paid';
  assignmentKey: string; // Unique key for table rows
}

const PDF_ROW_COLORS = ['#E9F7EF', '#FEF3E6', '#F0F5FF', '#FDF2FA', '#F4F4F5', '#FFFBEB', '#E6F4FF'];

export function CrewReport() {
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery(query(collection(db, "projects"), orderBy("name")));
  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));
  const { data: allShifts, isLoading: shiftsLoading } = useFirestoreQuery<Shift>(collection(db, "shifts"));

  const [selectedCrewMid, setSelectedCrewMid] = useState<string>('');
  
  const uniqueCrewMembers = useMemo(() => {
    if (!allCrew) return [];
    const uniqueMids = new Map<string, CrewMember>();
    allCrew.forEach(crew => {
        if (!uniqueMids.has(crew.mid)) {
            uniqueMids.set(crew.mid, crew);
        }
    });
    return Array.from(uniqueMids.values()).sort((a,b) => a.name.localeCompare(b.name));
  }, [allCrew]);
  
  const selectedCrewMember = useMemo(() => {
      return uniqueCrewMembers?.find(c => c.mid === selectedCrewMid);
  }, [uniqueCrewMembers, selectedCrewMid]);

  const reportData = useMemo((): CrewReportData[] => {
    if (!selectedCrewMid || !projects || !allShifts || !allCrew) return [];

    const financials: CrewReportData[] = [];

    const memberCrewProfiles = allCrew.filter(c => c.mid === selectedCrewMid);
    if (memberCrewProfiles.length === 0) return [];

    const memberCrewProfileIds = new Set(memberCrewProfiles.map(p => p.id));
    const memberShifts = allShifts.filter(s => memberCrewProfileIds.has(s.crewId));

    for (const project of projects) {
      // Find all roles this person has in this specific project
      const assignmentsInProject = project.crew.filter(c => c.mid === selectedCrewMid);

      for (const assignment of assignmentsInProject) {
        // Filter shifts to only those for this specific person, project, AND designation
        const shiftsForRole = memberShifts.filter(s => 
          s.projectId === project.id &&
          s.crewId === assignment.crewId // Match the unique profile ID for this role
        );

        if (shiftsForRole.length === 0) continue;

        const totalShifts = shiftsForRole.reduce((acc, s) => acc + s.shiftDuration, 0);
        const totalEarning = shiftsForRole.reduce((acc, s) => acc + s.earnedAmount, 0);
        const totalPaid = shiftsForRole.reduce((acc, s) => acc + s.paidAmount, 0);
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

        financials.push({
          project,
          designation: assignment.designation,
          dailyWage: assignment.dailyWage,
          totalShifts,
          totalEarning,
          totalPaid,
          balance,
          paymentStatus,
          assignmentKey: `${project.id}-${assignment.crewId}`
        });
      }
    }

    return financials.sort((a,b) => new Date(b.project.startDate).getTime() - new Date(a.project.startDate).getTime());
  }, [selectedCrewMid, projects, allShifts, allCrew]);


  const summary = useMemo(() => {
    if (!reportData) return { totalEarning: 0, totalPaid: 0, balance: 0, totalShifts: 0 };
    const totalShifts = reportData.reduce((acc, row) => acc + row.totalShifts, 0);
    const totalEarning = reportData.reduce((acc, row) => acc + row.totalEarning, 0);
    const totalPaid = reportData.reduce((acc, row) => acc + row.totalPaid, 0);
    const balance = totalEarning - totalPaid;
    return { totalEarning, totalPaid, balance, totalShifts };
  }, [reportData]);
  
  const isLoading = projectsLoading || crewLoading || shiftsLoading;

  const handleExport = (formatType: 'pdf' | 'excel', selectedAssignmentKeys: string[]) => {
    const dataToExport = reportData.filter(row => selectedAssignmentKeys.includes(row.assignmentKey));
    if (formatType === 'pdf') {
      handleExportPDF(dataToExport);
    } else {
      handleExportExcel(dataToExport);
    }
  };

  const generateFileName = () => {
    if (!selectedCrewMember) return `Crew_Report_${format(new Date(), 'ddMMMyyyy')}`;
    return `Crew_Report_${selectedCrewMember.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMMyyyy')}`;
  }

  const handleExportPDF = (dataToExport: CrewReportData[]) => {
    if (!selectedCrewMember || dataToExport.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });

    const exportTime = format(new Date(), 'PPP p');
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(selectedCrewMember.name, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`MID: ${selectedCrewMember.mid} | Mobile: ${selectedCrewMember.mobile || 'N/A'}`, doc.internal.pageSize.getWidth() / 2, 28, { align: 'center' });
    doc.text(`Address: ${selectedCrewMember.address || 'N/A'}`, doc.internal.pageSize.getWidth() / 2, 34, { align: 'center' });
    
    const tableData = dataToExport.map((row, index) => [
      index + 1,
      row.project.name,
      row.designation,
      `Rs. ${row.dailyWage.toLocaleString()}`,
      row.totalShifts.toFixed(2),
      `Rs. ${row.totalEarning.toLocaleString()}`,
      `Rs. ${row.totalPaid.toLocaleString()}`,
      `Rs. ${row.balance.toLocaleString()}`,
      row.paymentStatus,
    ]);

    const designationColorMap = new Map<string, string>();
    let colorIndex = 0;
    dataToExport.forEach(row => {
        if (!designationColorMap.has(row.designation)) {
            designationColorMap.set(row.designation, PDF_ROW_COLORS[colorIndex % PDF_ROW_COLORS.length]);
            colorIndex++;
        }
    });

    autoTable(doc, {
      startY: 45,
      head: [['Sr. No.', 'Project Name', 'Designation', 'Rate/Day', 'Total Shifts', 'Total Earning', 'Total Paid', 'Balance', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: '#0A0F1E', textColor: 255, fontStyle: 'bold' },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.cell.raw !== undefined) {
            const designation = dataToExport[data.row.index].designation;
            const color = designationColorMap.get(designation) || '#FFFFFF';
            doc.setFillColor(color);
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
            doc.setTextColor(0, 0, 0);
            doc.text(String(data.cell.raw), data.cell.x + 2, data.cell.y + data.cell.height / 2, { valign: 'middle' });
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

  const handleExportExcel = (dataToExport: CrewReportData[]) => {
    if (!selectedCrewMember || dataToExport.length === 0) return;
    
    const exportTime = format(new Date(), 'PPP p');

    const header = [
        ["Crew Member Report"],
        [selectedCrewMember.name],
        [`MID: ${selectedCrewMember.mid}`, `Mobile: ${selectedCrewMember.mobile || 'N/A'}`],
        [`Address: ${selectedCrewMember.address || 'N/A'}`],
        [`Exported on: ${exportTime}`],
        [] // Blank row
    ];

    const tableHeader = ['Sr. No.', 'Project Name', 'Designation', 'Rate/Day (INR)', 'Total Shifts', 'Total Earning (INR)', 'Total Paid (INR)', 'Balance (INR)', 'Payment Status'];
    const tableBody = dataToExport.map((row, index) => ([
      index + 1,
      row.project.name,
      row.designation,
      row.dailyWage,
      row.totalShifts.toFixed(2),
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

    // Add formatting and merging
    worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: tableHeader.length - 1 } }, // Merge for main title
        { s: { r: 1, c: 0 }, e: { r: 1, c: tableHeader.length - 1 } }, // Merge for crew name
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

  const exportOptions = reportData.map(d => ({id: d.assignmentKey, name: `${d.project.name} (${d.designation})`}));

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex-grow">
                <CardTitle className="font-bold">Crew-wise Report</CardTitle>
                <CardDescription>Select a crew member to view their project history by role.</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                 <Select value={selectedCrewMid} onValueChange={setSelectedCrewMid} disabled={crewLoading}>
                    <SelectTrigger className="w-full sm:w-[240px]">
                        <SelectValue placeholder="Select Crew Member" />
                    </SelectTrigger>
                    <SelectContent>
                        {uniqueCrewMembers?.map(c => <SelectItem key={c.id} value={c.mid}>{c.name} ({c.mid})</SelectItem>)}
                    </SelectContent>
                </Select>
                <ReportExportDialog 
                    options={exportOptions}
                    onExport={handleExport}
                    disabled={!selectedCrewMid || reportData.length === 0}
                />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96"><Loader text="Generating Crew Report..." /></div>
        ) : selectedCrewMid ? (
          reportData.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard title="Total Shifts" value={summary.totalShifts.toFixed(2)} icon={Briefcase} />
                  <SummaryCard title="Lifetime Earnings" value={`₹${summary.totalEarning.toLocaleString()}`} icon={Wallet} />
                  <SummaryCard title="Lifetime Paid" value={`₹${summary.totalPaid.toLocaleString()}`} icon={Wallet} color="text-green-500" />
                  <SummaryCard title="Lifetime Balance" value={`₹${summary.balance.toLocaleString()}`} icon={Wallet} color="text-red-500" />
              </div>
              <ScrollArea className="h-[450px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 pr-4">
                    {reportData.map((row) => (
                      <Card key={row.assignmentKey} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="text-lg">{row.project.name}</CardTitle>
                            <CardDescription>{row.designation}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-2 text-sm">
                            <p className="flex justify-between"><span>Total Shifts:</span> <span className="font-medium">{row.totalShifts.toFixed(2)}</span></p>
                            <p className="flex justify-between"><span>Rate/Day:</span> <span className="font-medium">₹{(row.dailyWage || 0).toLocaleString()}</span></p>
                            <p className="flex justify-between"><span>Total Earning:</span> <span className="font-medium">₹{row.totalEarning.toLocaleString()}</span></p>
                            <p className="flex justify-between"><span>Total Paid:</span> <span className="font-medium">₹{row.totalPaid.toLocaleString()}</span></p>
                            <p className="flex justify-between font-semibold"><span>Balance:</span> <span>₹{row.balance.toLocaleString()}</span></p>
                        </CardContent>
                        <CardFooter>
                            <Badge variant={getStatusBadgeVariant(row.paymentStatus)}>{row.paymentStatus}</Badge>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Report Data</h3>
                <p className="mt-1 text-sm text-muted-foreground">This crew member has not been assigned to any projects yet.</p>
            </div>
          )
        ) : (
           <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Select a Crew Member</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a crew member from the dropdown to generate a report.</p>
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
