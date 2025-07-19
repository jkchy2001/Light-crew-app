
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, FileText, FileSpreadsheet } from "lucide-react"
import type { Project, CrewMember, Shift } from "@/lib/types"
import { useFirestoreQuery } from "@/hooks/use-firestore-query"
import { db } from "@/lib/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { Loader } from "@/components/shared/loader"
import { ScrollArea } from "@/components/ui/scroll-area"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"
import {
  isWithinInterval,
  parseISO,
  startOfMonth,
  addMonths,
  endOfMonth,
  getDaysInMonth,
  format,
} from 'date-fns'
import { Badge } from "../ui/badge"
import { cn } from "@/lib/utils"

interface MonthlyAttendanceData {
  month: string;
  year: number;
  daysInMonth: number;
  rows: AttendanceRow[];
}

interface AttendanceRow {
  srNo: number;
  name: string;
  designation: string;
  mid: string;
  shifts: { [day: number]: number };
  totalShifts: number;
  totalDays: number;
}

const PDF_ROW_COLORS = ['#E9F7EF', '#FEF3E6', '#F0F5FF', '#FDF2FA', '#F4F4F5', '#FFFBEB', '#E6F4FF'];

export function AttendanceReport() {
  const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));
  const { data: allCrew, isLoading: crewLoading } = useFirestoreQuery<CrewMember>(query(collection(db, "crew"), orderBy("name")));
  const { data: allShifts, isLoading: shiftsLoading } = useFirestoreQuery<Shift>(query(collection(db, "shifts"), orderBy("date")));
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const selectedProject = useMemo(() => {
    return projects?.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const reportData = useMemo((): MonthlyAttendanceData[] => {
    if (!selectedProject || !allShifts || !allCrew || !selectedProject.startDate || !selectedProject.endDate) return [];

    const projectShifts = allShifts.filter(s => s.projectId === selectedProject.id);
    if (!projectShifts.length) return [];

    const projectStart = parseISO(selectedProject.startDate);
    const projectEnd = parseISO(selectedProject.endDate);
    
    const months: Date[] = [];
    let currentMonthStart = startOfMonth(projectStart);

    while (currentMonthStart <= projectEnd) {
      months.push(currentMonthStart);
      currentMonthStart = addMonths(currentMonthStart, 1);
    }
    
    return months.map(monthDate => {
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const daysInMonth = getDaysInMonth(monthDate);

      const attendanceRows: AttendanceRow[] = selectedProject.crew.map((assignment, index) => {
        const crewMember = allCrew.find(c => c.id === assignment.crewId);
        if (!crewMember) return null;

        const shiftsInMonth = projectShifts.filter(s => {
          const shiftDate = parseISO(s.date);
          return s.crewId === assignment.crewId && isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
        });
        
        const shiftsByDay: { [day: number]: number } = {};
        shiftsInMonth.forEach(s => {
          const dayOfMonth = parseISO(s.date).getDate();
          shiftsByDay[dayOfMonth] = (shiftsByDay[dayOfMonth] || 0) + s.shiftDuration;
        });
        
        const totalShifts = Object.values(shiftsByDay).reduce((sum, val) => sum + val, 0);
        const totalDays = Object.keys(shiftsByDay).length;

        return {
          srNo: index + 1,
          name: crewMember.name,
          designation: assignment.designation,
          mid: assignment.mid,
          shifts: shiftsByDay,
          totalShifts,
          totalDays,
        };
      }).filter((row): row is AttendanceRow => row !== null && row.totalShifts > 0)
      .map((row, index) => ({...row, srNo: index + 1})); // Re-assign Sr. No. after filtering

      return {
        month: format(monthDate, 'MMMM'),
        year: monthDate.getFullYear(),
        daysInMonth,
        rows: attendanceRows,
      };
    }).filter(monthData => monthData.rows.length > 0);

  }, [selectedProject, allShifts, allCrew]);

  const isLoading = projectsLoading || crewLoading || shiftsLoading;

  const generateFileName = () => {
    if (!selectedProject) return `Attendance_Report_${format(new Date(), 'ddMMMyyyy')}`;
    return `Attendance_${selectedProject.name.replace(/\s+/g, '_')}_${format(new Date(), 'ddMMMyyyy')}`;
  };

  const exportPDF = () => {
    if (!selectedProject || reportData.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });
    const exportTime = format(new Date(), 'PPP p');
    
    const tableHeaderStyles = { fillColor: '#0A0F1E', textColor: 255, fontStyle: 'bold' as const, fontSize: 8 };

    reportData.forEach((monthData, monthIndex) => {
      if(monthIndex > 0) doc.addPage("landscape");
      
      let yPos = 15;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedProject.name, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Client: ${selectedProject.client || 'N/A'} | Location: ${selectedProject.location || 'N/A'}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 6;
      
      const startDate = selectedProject.startDate ? format(parseISO(selectedProject.startDate), 'dd MMM yyyy') : 'N/A';
      const endDate = selectedProject.endDate ? format(parseISO(selectedProject.endDate), 'dd MMM yyyy') : 'N/A';
      doc.text(`Dates: ${startDate} to ${endDate}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 6;

      doc.text(`DOP: ${selectedProject.dop || 'N/A'} | Gaffer: ${selectedProject.gaffer || 'N/A'}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Attendance Report for ${monthData.month} ${monthData.year}`, doc.internal.pageSize.getWidth() / 2, yPos, { align: 'center' });
      yPos += 10;

      const head = [["Sr.", "Name", "Designation", "MID"]];
      for (let i = 1; i <= monthData.daysInMonth; i++) head[0].push(i.toString());
      head[0].push("Total Shifts", "Total Days");
      
      const body = monthData.rows.map(row => {
        const rowData: (string|number)[] = [row.srNo, row.name, row.designation, row.mid];
        for (let i = 1; i <= monthData.daysInMonth; i++) {
          rowData.push(row.shifts[i] || '');
        }
        rowData.push(row.totalShifts.toFixed(2), row.totalDays);
        return rowData;
      });

      const designationColorMap = new Map<string, string>();
      let colorIndex = 0;
      monthData.rows.forEach(row => {
        if (!designationColorMap.has(row.designation)) {
          designationColorMap.set(row.designation, PDF_ROW_COLORS[colorIndex % PDF_ROW_COLORS.length]);
          colorIndex++;
        }
      });

      autoTable(doc, {
        head: head,
        body: body,
        startY: yPos,
        theme: 'grid',
        headStyles: tableHeaderStyles,
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 8 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
        },
        didDrawCell: (data) => {
            if (data.section === 'body' && data.cell.raw !== undefined) {
                const designation = monthData.rows[data.row.index].designation;
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
    });
    
    doc.save(`${generateFileName()}.pdf`);
  };

  const exportExcel = () => {
    if (!selectedProject || reportData.length === 0) return;
    const workbook = XLSX.utils.book_new();
    const startDate = selectedProject.startDate ? format(parseISO(selectedProject.startDate), 'dd MMM yyyy') : 'N/A';
    const endDate = selectedProject.endDate ? format(parseISO(selectedProject.endDate), 'dd MMM yyyy') : 'N/A';

    reportData.forEach(monthData => {
      const header = [
          [`Attendance Report - ${selectedProject.name}`],
          [`Client: ${selectedProject.client || 'N/A'}`, `Location: ${selectedProject.location || 'N/A'}`],
          [`Dates: ${startDate} to ${endDate}`],
          [`DOP: ${selectedProject.dop || 'N/A'}`, `Gaffer: ${selectedProject.gaffer || 'N/A'}`],
          [], // Blank row
          [`Attendance for Month: ${monthData.month} ${monthData.year}`],
          []
      ];

      const tableHeader = ["Sr. No.", "Name", "Designation", "MID"];
      for (let i = 1; i <= monthData.daysInMonth; i++) tableHeader.push(i.toString());
      tableHeader.push("Total Shifts", "Total Days");
      
      const tableBody = monthData.rows.map(row => {
          const rowData: (string|number)[] = [row.srNo, row.name, row.designation, row.mid];
          for (let i = 1; i <= monthData.daysInMonth; i++) {
              rowData.push(row.shifts[i] || '');
          }
          rowData.push(row.totalShifts.toFixed(2), row.totalDays);
          return rowData;
      });
      
      const worksheetData = [...header, tableHeader, ...tableBody];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      worksheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: tableHeader.length - 1 } },
          { s: { r: 5, c: 0 }, e: { r: 5, c: tableHeader.length - 1 } },
      ];
      worksheet['A1'].s = { font: { bold: true, sz: 16 }, alignment: { horizontal: 'center' } };
      worksheet['A6'].s = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'center' } };

      XLSX.utils.book_append_sheet(workbook, worksheet, `${monthData.month}_${monthData.year}`);
    });

    XLSX.writeFile(workbook, `${generateFileName()}.xlsx`);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex-grow">
              <CardTitle className="font-bold">Attendance Report</CardTitle>
              <CardDescription>Generate a monthly attendance sheet for a selected project.</CardDescription>
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
            <Button onClick={exportPDF} disabled={!selectedProjectId || reportData.length === 0}><FileText className="mr-2 h-4 w-4"/>PDF</Button>
            <Button onClick={exportExcel} disabled={!selectedProjectId || reportData.length === 0}><FileSpreadsheet className="mr-2 h-4 w-4"/>Excel</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-96"><Loader text="Generating Attendance Report..." /></div>
        ) : selectedProjectId ? (
          reportData.length > 0 ? (
            <ScrollArea className="h-[60vh]">
                <div className="space-y-6">
                {reportData.map(monthData => (
                    <div key={`${monthData.month}-${monthData.year}`}>
                    <h3 className="text-lg font-semibold mb-2 text-center">{`Attendance for ${monthData.month} ${monthData.year}`}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthData.rows.map(row => (
                            <Card key={`${row.mid}-${row.designation}`} className="bg-muted/30">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{row.name}</CardTitle>
                                    <CardDescription>{row.designation} ({row.mid})</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                                        {[...Array(monthData.daysInMonth)].map((_, i) => (
                                            <div key={i+1} className="flex flex-col items-center">
                                                <span className="font-bold text-muted-foreground">{i+1}</span>
                                                <span className={cn("font-mono h-5", row.shifts[i+1] && "text-accent font-bold")}>
                                                    {row.shifts[i+1] ? `${row.shifts[i+1]}` : '-'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between bg-background/50 p-2 text-sm">
                                    <Badge variant="secondary">Days: {row.totalDays}</Badge>
                                    <Badge>Shifts: {row.totalShifts.toFixed(2)}</Badge>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Attendance Data</h3>
                <p className="mt-1 text-sm text-muted-foreground">No shifts have been logged for this project.</p>
            </div>
          )
        ) : (
           <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Select a Project</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a project to generate an attendance report.</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
