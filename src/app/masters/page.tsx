
'use client';

import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DopMaster } from "@/components/settings/masters/dop-master";
import { GafferMaster } from "@/components/settings/masters/gaffer-master";
import { DesignationMaster } from "@/components/settings/masters/designation-master";

export default function MastersPage() {
    return (
        <div className="space-y-6">
            <PageHeader
                title="masters_title"
                description="masters_description"
            />
            <Card className="glass-card w-full">
                <CardHeader>
                    <CardTitle>Master Lists</CardTitle>
                    <CardDescription>Manage central lists for DOPs, Gaffers, and Designations.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="dop">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="dop">DOP</TabsTrigger>
                            <TabsTrigger value="gaffer">Gaffer</TabsTrigger>
                            <TabsTrigger value="designation">Designation</TabsTrigger>
                        </TabsList>
                        <TabsContent value="dop" className="mt-4">
                            <DopMaster />
                        </TabsContent>
                        <TabsContent value="gaffer" className="mt-4">
                            <GafferMaster />
                        </TabsContent>
                        <TabsContent value="designation" className="mt-4">
                            <DesignationMaster />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
