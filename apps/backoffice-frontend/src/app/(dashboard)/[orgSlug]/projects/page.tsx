import { Button } from '@repo/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

interface ProjectsPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage and organize volunteer projects
          </p>
        </div>
        <Button asChild>
          <Link href={`/${orgSlug}/projects/create`}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Project
          </Link>
        </Button>
      </div>

      {/* TODO: Project list will go here */}
      <div className="text-muted-foreground">
        No projects yet. Create your first project to get started.
      </div>
    </div>
  );
}
