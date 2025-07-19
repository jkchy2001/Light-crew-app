
"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FileDown, FileText, FileSpreadsheet } from "lucide-react"
import { useState, useEffect } from "react"
import { ScrollArea } from "../ui/scroll-area"

type Option = {
  id: string;
  name: string;
};

type ReportExportDialogProps = {
  options: Option[];
  onExport: (formatType: 'pdf' | 'excel', selectedIds: string[]) => void;
  disabled?: boolean;
  requireSelection?: boolean; // Set to false for project-wise export
};

export function ReportExportDialog({ options, onExport, disabled = false, requireSelection = true }: ReportExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // When options change (e.g., selecting a new crew member), re-select all by default.
  useEffect(() => {
    if (requireSelection) {
        setSelectedIds(options.map(o => o.id));
    }
  }, [options, requireSelection]);


  const handleExportClick = (formatType: 'pdf' | 'excel') => {
    onExport(formatType, selectedIds);
    setOpen(false);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && requireSelection) {
        // Pre-select all when opening
        setSelectedIds(options.map(o => o.id));
    }
    setOpen(isOpen);
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(pId => pId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
      setSelectedIds(checked ? options.map(o => o.id) : []);
  }

  const handleExportWithoutSelection = (type: 'pdf' | 'excel') => {
    onExport(type, []);
    setOpen(false);
  }

  if (!requireSelection) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>
                    <FileDown className="mr-2 h-4 w-4" /> Export
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[350px]">
                <DialogHeader>
                    <DialogTitle>Choose Export Format</DialogTitle>
                    <DialogDescription>
                        Select the file format for your report.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex justify-center gap-4 py-4">
                    <Button variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => handleExportWithoutSelection('pdf')}>
                        <FileText className="h-8 w-8 text-red-500" />
                        <span>Export as PDF</span>
                    </Button>
                    <Button variant="outline" className="w-full h-20 flex-col gap-2" onClick={() => handleExportWithoutSelection('excel')}>
                        <FileSpreadsheet className="h-8 w-8 text-green-500"/>
                        <span>Export as Excel</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <FileDown className="mr-2 h-4 w-4" /> Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Your Report</DialogTitle>
          <DialogDescription>
            Select the project roles you want to include in the export.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="flex items-center space-x-2 border-b pb-2">
                <Checkbox
                    id="select-all"
                    checked={options.length > 0 && selectedIds.length === options.length}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                />
                <Label htmlFor="select-all" className="text-sm font-medium leading-none">
                   Select All
                </Label>
            </div>
            <ScrollArea className="h-64">
                <div className="space-y-2 pr-4">
                {options.map(option => (
                    <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={option.id}
                        checked={selectedIds.includes(option.id)}
                        onCheckedChange={(checked) => handleCheckboxChange(option.id, Boolean(checked))}
                    />
                    <Label htmlFor={option.id} className="flex-1 truncate">{option.name}</Label>
                    </div>
                ))}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <div className="flex gap-2">
            <Button onClick={() => handleExportClick('pdf')} disabled={selectedIds.length === 0}>
                <FileText className="mr-2 h-4 w-4" /> Export PDF
            </Button>
            <Button onClick={() => handleExportClick('excel')} disabled={selectedIds.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Excel
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
