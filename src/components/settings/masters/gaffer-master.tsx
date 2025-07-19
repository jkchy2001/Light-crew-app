
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Pencil, Trash2, Eye, Mail, MapPin, FolderKanban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Gaffer, Project } from "@/lib/types";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader } from "@/components/shared/loader";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";

export function GafferMaster() {
    const { toast } = useToast();
    const { data: gaffers, isLoading: gaffersLoading } = useFirestoreQuery<Gaffer>(query(collection(db, "gaffers"), orderBy("name")));
    const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));

    const [editingGaffer, setEditingGaffer] = useState<Gaffer | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

    const projectOptions: MultiSelectOption[] = projects?.map(p => ({ value: p.id, label: p.name })) || [];

    useEffect(() => {
        if (editingGaffer) {
            setName(editingGaffer.name);
            setMobile(editingGaffer.mobile);
            setEmail(editingGaffer.email || '');
            setAddress(editingGaffer.address || '');
            setSelectedProjectIds(editingGaffer.projectIds || []);
        } else {
            resetForm();
        }
    }, [editingGaffer]);

    const resetForm = () => {
        setName('');
        setMobile('');
        setEmail('');
        setAddress('');
        setSelectedProjectIds([]);
        setEditingGaffer(null);
        setViewOnly(false);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const gafferData: Partial<Gaffer> = { 
            name, 
            mobile, 
            email, 
            address,
            projectIds: selectedProjectIds
        };

        try {
            if (editingGaffer) {
                await updateDoc(doc(db, "gaffers", editingGaffer.id), gafferData);
                toast({ title: 'Gaffer Updated', description: `"${name}" has been updated.` });
            } else {
                await addDoc(collection(db, "gaffers"), gafferData);
                toast({ title: 'Gaffer Added', description: `"${name}" has been added to the list.` });
            }
            resetForm();
        } catch (error) {
            console.error("Error submitting Gaffer:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save Gaffer details.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteDoc(doc(db, "gaffers", id));
            toast({ variant: 'destructive', title: 'Gaffer Deleted', description: `"${name}" has been removed.` });
            if (editingGaffer?.id === id) {
                resetForm();
            }
        } catch (error) {
            console.error("Error deleting Gaffer:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete Gaffer.' });
        }
    };

    const handleEdit = (gaffer: Gaffer) => {
        setEditingGaffer(gaffer);
        setViewOnly(false);
    };
    
    const handleView = (gaffer: Gaffer) => {
        setEditingGaffer(gaffer);
        setViewOnly(true);
    };

    const isFormDisabled = isLoading || viewOnly || projectsLoading;
    const isSubmitDisabled = isLoading || viewOnly;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {editingGaffer ? (viewOnly ? 'View Gaffer' : 'Edit Gaffer') : 'Add New Gaffer'}
                    </CardTitle>
                    <CardDescription>
                        {editingGaffer ? `Viewing details for ${editingGaffer.name}` : 'Fill out the form to add a new Gaffer.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="gaffer-name">Full Name</Label>
                            <Input id="gaffer-name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" required disabled={isFormDisabled}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gaffer-mobile">Mobile Number</Label>
                            <Input id="gaffer-mobile" value={mobile} onChange={e => setMobile(e.target.value)} type="tel" placeholder="Enter mobile number" required disabled={isFormDisabled}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="gaffer-email">Email (Optional)</Label>
                            <Input id="gaffer-email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Enter email address" disabled={isFormDisabled}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gaffer-address">Address (Optional)</Label>
                            <Textarea id="gaffer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address" disabled={isFormDisabled}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gaffer-projects">Assign Projects</Label>
                            <MultiSelect 
                                options={projectOptions}
                                selected={selectedProjectIds}
                                onChange={setSelectedProjectIds}
                                placeholder="Select projects..."
                                disabled={isFormDisabled}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitDisabled}>{isLoading ? (editingGaffer ? 'Updating...' : 'Adding...') : (editingGaffer ? 'Update Gaffer' : 'Add Gaffer')}</Button>
                            {editingGaffer && <Button variant="outline" type="button" onClick={resetForm} disabled={isLoading}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gaffer List</CardTitle>
                    <CardDescription>View and manage existing Gaffers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        {gaffersLoading ? (
                            <Loader />
                        ) : (
                             <div className="grid grid-cols-1 gap-4">
                                {gaffers?.map((gaffer) => (
                                    <Card key={gaffer.id} className={editingGaffer?.id === gaffer.id ? 'bg-muted/50' : ''}>
                                        <CardHeader className="flex flex-row items-center justify-between p-4">
                                            <div>
                                                <CardTitle className="text-base">{gaffer.name}</CardTitle>
                                                <CardDescription>{gaffer.mobile}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleView(gaffer)}><Eye className="mr-2 h-4 w-4"/>View</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(gaffer)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(gaffer.id, gaffer.name)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 space-y-2 text-sm text-muted-foreground">
                                            {gaffer.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> <span className="truncate">{gaffer.email}</span></div>}
                                            {gaffer.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> <span className="truncate">{gaffer.address}</span></div>}
                                            {gaffer.projectIds && gaffer.projectIds.length > 0 && (
                                                <div className="flex items-start gap-2 pt-2">
                                                    <FolderKanban className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {gaffer.projectIds.map(id => {
                                                            const project = projects?.find(p => p.id === id);
                                                            return project ? <Badge key={id} variant="secondary">{project.name}</Badge> : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
