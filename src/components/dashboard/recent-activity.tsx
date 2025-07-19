
"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Shift, Project } from "@/lib/types"
import { useMemo, useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Loader } from "@/components/shared/loader"

interface RecentActivityProps {
    shifts?: Shift[] | null;
    projects?: Project[] | null;
}

export function RecentActivity({ shifts, projects }: RecentActivityProps) {
    const [loading, setLoading] = useState(true);

    const recentShifts = useMemo(() => {
        if (!shifts || !projects) return [];
        return shifts
            .slice(0, 5) // Get the 5 most recent shifts (already sorted by date desc in dashboard)
            .map(shift => {
                const project = projects.find(p => p.id === shift.projectId);
                return {
                    ...shift,
                    projectName: project?.name || "Unknown Project",
                }
            })
    }, [shifts, projects]);

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, [shifts, projects]);

    if (loading) {
        return (
            <Card className="glass-card">
                 <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="h-[260px]">
                    <Loader text="Loading Activities..." />
                </CardContent>
            </Card>
        )
    }

    if(recentShifts.length === 0) {
        return (
             <Card className="glass-card">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                        No recent activity found.
                     </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[260px]">
                    <div className="space-y-6 pr-4">
                        {recentShifts.map((activity, index) => (
                            <div key={activity.id} className="relative pl-6">
                              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" />
                              <div className="absolute left-[3px] top-[14px] w-0.5 h-full bg-border" />

                              <div className="flex-1">
                                  <div className="flex items-center justify-between flex-wrap gap-x-2">
                                     <p className="font-medium text-sm">Attendance Logged</p>
                                     <p className="text-xs text-muted-foreground">{format(parseISO(activity.date), "dd MMM, yyyy")}</p>
                                  </div>
                                  <p className="text-sm text-muted-foreground">Shift on {activity.projectName}</p>
                              </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

    