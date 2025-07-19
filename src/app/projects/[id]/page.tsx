
'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MapPin, User, Video } from 'lucide-react';
import type { Project } from '@/lib/types';
import { useFirestoreQuery } from '@/hooks/use-firestore-query';
import { collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMemo } from 'react';
import { Loader } from '@/components/shared/loader';


const getStatusBadgeVariant = (status: string): "default" | "secondary" | "outline" | "destructive" | null | undefined => {
    switch(status) {
        case "Ongoing": return "default";
        case "Upcoming": return "secondary";
        case "Completed": return "outline";
        default: return "default";
    }
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  
  const projectQuery = useMemo(() => {
      if (!projectId) return null;
      return query(collection(db, 'projects'), where('__name__', '==', projectId));
  }, [projectId]);

  const { data: projects, isLoading } = useFirestoreQuery<Project>(projectQuery);

  const project = useMemo(() => (projects ? projects[0] : undefined), [projects]);

  if (isLoading) {
    return <Loader text="Loading Project Details..." />;
  }

  if (!project) {
    return (
        <div className="text-center py-16">
            <h1 className="text-2xl font-bold">Project Not Found</h1>
            <p className="text-muted-foreground">The project you are looking for does not exist.</p>
            <Button onClick={() => router.push('/projects')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
            </Button>
      </div>
    );
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/projects')}>
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant={getStatusBadgeVariant(project.status)} className="text-base">{project.status}</Badge>
        </div>

        <Card className="glass-card">
            <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription>All the important information about "{project.name}".</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
                   <div className="flex items-start gap-3">
                        <Video className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Client</p>
                            <p className="text-muted-foreground">{project.client || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Location(s)</p>
                            <p className="text-muted-foreground">{project.location}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Project Dates</p>
                            <p className="text-muted-foreground">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <User className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Director of Photography (DOP)</p>
                            <p className="text-muted-foreground">{project.dop || 'N/A'}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <User className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Gaffer</p>
                            <p className="text-muted-foreground">{project.gaffer || 'N/A'}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3">
                        <User className="h-5 w-5 mt-1 text-accent flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Best Boy</p>
                            <p className="text-muted-foreground">{project.bestBoy || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="pt-4">
                     <p className="font-semibold mb-2">Description</p>
                     <p className="text-muted-foreground prose prose-sm max-w-none">
                        {project.description || 'No description provided.'}
                     </p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

    