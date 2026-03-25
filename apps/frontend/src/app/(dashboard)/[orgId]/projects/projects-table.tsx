import type { ProjectListItem } from '@repo/data';
import {
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';

interface ProjectsTableProps {
  projects: ProjectListItem[];
}

const statusConfig = {
  DRAFT: { variant: 'secondary' as const, label: 'Draft' },
  ACTIVE: { variant: 'default' as const, label: 'Active' },
  ARCHIVED: { variant: 'outline' as const, label: 'Archived' },
  EXPIRED: { variant: 'destructive' as const, label: 'Expired' },
};

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="hover:bg-accent/25">
              <TableCell className="font-medium">{project.title}</TableCell>
              <TableCell className="max-w-md truncate">
                {project.description}
              </TableCell>
              <TableCell>{project.location}</TableCell>
              <TableCell>{formatDisplayDate(project.startsAt)}</TableCell>
              <TableCell>{formatDisplayDate(project.endsAt)}</TableCell>
              <TableCell>
                <Badge variant={statusConfig[project.status].variant}>
                  {statusConfig[project.status].label}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
