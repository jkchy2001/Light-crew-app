
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal, Pencil, Trash2, Eye, Mail, MapPin, FolderKanban } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import type { DOP, Project } from "@/lib/types";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader } from "@/components/shared/loader";
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";

export function DopMaster() {
    const { toast } = useToast();
    const { data: dops, isLoading: dopsLoading } = useFirestoreQuery<DOP>(query(collection(db, "dops"), orderBy("name")));
    const { data: projects, isLoading: projectsLoading } = useFirestoreQuery<Project>(query(collection(db, "projects"), orderBy("name")));

    const [editingDop, setEditingDop] = useState<DOP | null>(null);
    const [viewOnly, setViewOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
    
    const projectOptions: MultiSelectOption[] = projects?.map(p => ({ value: p.id, label: p.name })) || [];

    useEffect(() => {
        if (editingDop) {
            setName(editingDop.name);
            setMobile(editingDop.mobile);
            setEmail(editingDop.email || '');
            setAddress(editingDop.address || '');
            setSelectedProjectIds(editingDop.projectIds || []);
        } else {
            resetForm();
        }
    }, [editingDop]);

    const resetForm = () => {
        setName('');
        setMobile('');
        setEmail('');
        setAddress('');
        setSelectedProjectIds([]);
        setEditingDop(null);
        setViewOnly(false);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        
        const dopData: Partial<DOP> = { 
            name, 
            mobile, 
            email, 
            address, 
            projectIds: selectedProjectIds 
        };

        try {
            if (editingDop) {
                await updateDoc(doc(db, "dops", editingDop.id), dopData);
                toast({ title: 'DOP Updated', description: `"${name}" has been updated.` });
            } else {
                await addDoc(collection(db, "dops"), dopData);
                toast({ title: 'DOP Added', description: `"${name}" has been added to the list.` });
            }
            resetForm();
        } catch (error) {
            console.error("Error submitting DOP:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save DOP details.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDelete = async (id: string, name: string) => {
        try {
            await deleteDoc(doc(db, "dops", id));
            toast({ variant: 'destructive', title: 'DOP Deleted', description: `"${name}" has been removed.` });
            if (editingDop?.id === id) {
                resetForm();
            }
        } catch (error) {
            console.error("Error deleting DOP:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete DOP.' });
        }
    };

    const handleEdit = (dop: DOP) => {
        setEditingDop(dop);
        setViewOnly(false);
    };
    
    const handleView = (dop: DOP) => {
        setEditingDop(dop);
        setViewOnly(true);
    };

    const isFormDisabled = isLoading || viewOnly || projectsLoading;
    const isSubmitDisabled = isLoading || viewOnly;
    
    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {editingDop ? (viewOnly ? 'View DOP' : 'Edit DOP') : 'Add New DOP'}
                    </CardTitle>
                    <CardDescription>
                        {editingDop ? `Viewing details for ${editingDop.name}` : 'Fill out the form to add a new Director of Photography.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="dop-name">Full Name</Label>
                            <Input id="dop-name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter full name" required disabled={isFormDisabled}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dop-mobile">Mobile Number</Label>
                            <Input id="dop-mobile" value={mobile} onChange={e => setMobile(e.target.value)} type="tel" placeholder="Enter mobile number" disabled={isFormDisabled}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dop-email">Email (Optional)</Label>
                            <Input id="dop-email" value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Enter email address" disabled={isFormDisabled}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dop-address">Address (Optional)</Label>
                            <Textarea id="dop-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address" disabled={isFormDisabled}/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dop-projects">Assign Projects</Label>
                            <MultiSelect 
                                options={projectOptions}
                                selected={selectedProjectIds}
                                onChange={setSelectedProjectIds}
                                placeholder="Select projects..."
                                disabled={isFormDisabled}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitDisabled}>{isLoading ? (editingDop ? 'Updating...' : 'Adding...') : (editingDop ? 'Update DOP' : 'Add DOP')}</Button>
                            {editingDop && <Button variant="outline" type="button" onClick={resetForm} disabled={isLoading}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>DOP List</CardTitle>
                    <CardDescription>View and manage existing DOPs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        {dopsLoading ? (
                            <Loader />
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {dops?.map((dop) => (
                                    <Card key={dop.id} className={editingDop?.id === dop.id ? 'bg-muted/50' : ''}>
                                        <CardHeader className="flex flex-row items-center justify-between p-4">
                                            <div>
                                                <CardTitle className="text-base">{dop.name}</CardTitle>
                                                <CardDescription>{dop.mobile}</CardDescription>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleView(dop)}><Eye className="mr-2 h-4 w-4"/>View</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(dop)}><Pencil className="mr-2 h-4 w-4"/>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDelete(dop.id, dop.name)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 space-y-2 text-sm text-muted-foreground">
                                            {dop.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-accent" /> <span className="truncate">{dop.email}</span></div>}
                                            {dop.address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /> <span className="truncate">{dop.address}</span></div>}
                                            {dop.projectIds && dop.projectIds.length > 0 && (
                                                <div className="flex items-start gap-2 pt-2">
                                                    <FolderKanban className="h-4 w-4 text-accent mt-1 flex-shrink-0" />
                                                    <div className="flex flex-wrap gap-1">
                                                        {dop.projectIds.map(id => {
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
