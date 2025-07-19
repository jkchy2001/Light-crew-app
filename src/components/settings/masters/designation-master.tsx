
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Designation } from "@/lib/types";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader } from "@/components/shared/loader";

export function DesignationMaster() {
    const { toast } = useToast();
    const { data: designations, isLoading: designationsLoading } = useFirestoreQuery<Designation>(query(collection(db, "designations"), orderBy("title")));
    
    const [newDesignationTitle, setNewDesignationTitle] = useState('');
    const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (editingDesignation) {
            setNewDesignationTitle(editingDesignation.title);
        } else {
            resetForm();
        }
    }, [editingDesignation]);

    const resetForm = () => {
        setNewDesignationTitle('');
        setEditingDesignation(null);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const title = newDesignationTitle.trim();
        if (!title) return;

        setIsLoading(true);

        try {
            if (editingDesignation) {
                await updateDoc(doc(db, "designations", editingDesignation.id), { title });
                toast({ title: 'Designation Updated', description: `"${title}" has been updated.` });
            } else {
                await addDoc(collection(db, "designations"), { title });
                toast({ title: 'Designation Added', description: `"${title}" has been added.` });
            }
            resetForm();
        } catch (error) {
            console.error("Error submitting designation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save designation.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        try {
            await deleteDoc(doc(db, "designations", id));
            toast({ variant: 'destructive', title: 'Designation Deleted', description: `"${title}" has been removed.` });
            if (editingDesignation?.id === id) {
                resetForm();
            }
        } catch (error) {
            console.error("Error deleting designation:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not delete designation.' });
        }
    };
    
    const handleEdit = (designation: Designation) => {
        setEditingDesignation(designation);
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
             <Card>
                <CardHeader>
                    <CardTitle>{editingDesignation ? 'Edit Designation' : 'Add Designation'}</CardTitle>
                    <CardDescription>{editingDesignation ? `Editing "${editingDesignation.title}"` : 'Add a new crew designation.'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="designation-title">Designation Title</Label>
                            <Input 
                                id="designation-title" 
                                placeholder="e.g., Spark" 
                                required 
                                value={newDesignationTitle}
                                onChange={(e) => setNewDesignationTitle(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" disabled={isLoading}>{isLoading ? (editingDesignation ? 'Updating...' : 'Adding...') : (editingDesignation ? 'Update' : 'Add Designation')}</Button>
                            {editingDesignation && <Button variant="outline" type="button" onClick={resetForm} disabled={isLoading}>Cancel</Button>}
                        </div>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Designation List</CardTitle>
                    <CardDescription>Manage all available designations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96">
                        {designationsLoading ? (
                            <Loader />
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                                {designations?.map((d) => (
                                    <div key={d.id} className={`flex items-center p-2 rounded-md ${editingDesignation?.id === d.id ? 'bg-muted/50' : ''}`}>
                                        <span className="font-medium flex-1">{d.title}</span>
                                        <div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(d)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(d.id, d.title)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    )
}
