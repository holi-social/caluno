import type { ProjectStatus } from '@repo/data';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

const statusConfig: Record<
  ProjectStatus,
  {
    variant: 'secondary' | 'default' | 'outline' | 'destructive';
    label: string;
  }
> = {
  DRAFT: { variant: 'secondary', label: 'Draft' },
  ACTIVE: { variant: 'default', label: 'Active' },
  ARCHIVED: { variant: 'outline', label: 'Archived' },
  EXPIRED: { variant: 'destructive', label: 'Expired' },
};

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface ProjectDetailPageProps {
  params: Promise<{
    orgId: string;
    projectId: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { orgId, projectId } = await params;

  // Verify organization access
  await requireOrgAccess(orgId);

  const data = await getDataClient();
  const project = await data.project.findById(projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        href={`/${orgId}/projects`}
        className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center"
      >
        ← Back to Projects
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{project.location}</span>
          </div>
        </div>

        <Badge variant={statusConfig[project.status].variant}>
          {statusConfig[project.status].label}
        </Badge>
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Project Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">
                {project.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Project Metadata */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start Date</span>
                </div>
                <p className="text-sm font-medium pl-6">
                  {formatDisplayDate(project.startsAt)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">End Date</span>
                </div>
                <p className="text-sm font-medium pl-6">
                  {formatDisplayDate(project.endsAt)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created By</span>
                </div>
                <p className="text-sm font-medium pl-6">
                  {project.createdBy.name}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Created</span>
                </div>
                <p className="text-sm font-medium pl-6">
                  {formatDisplayDate(project.createdAt)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
