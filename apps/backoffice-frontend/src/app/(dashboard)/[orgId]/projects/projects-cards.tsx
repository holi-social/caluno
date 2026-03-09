'use client';

import type { ProjectListItem } from '@repo/data';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@repo/ui';
import { Calendar, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

interface ProjectsCardsProps {
  projects: ProjectListItem[];
  orgId: string;
}

const statusConfig = {
  DRAFT: { variant: 'secondary' as const, label: 'draft' },
  ACTIVE: { variant: 'default' as const, label: 'active' },
  ARCHIVED: { variant: 'outline' as const, label: 'archived' },
  EXPIRED: { variant: 'destructive' as const, label: 'expired' },
};

export function ProjectsCards({ projects, orgId }: ProjectsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/${orgId}/projects/${project.id}`}
          className="group"
        >
          <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {project.title}
                </CardTitle>
                <Badge
                  variant={statusConfig[project.status].variant}
                  className="shrink-0"
                >
                  {statusConfig[project.status].label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>0h logged</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
