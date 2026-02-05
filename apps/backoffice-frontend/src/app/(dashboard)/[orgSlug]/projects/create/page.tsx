import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui';
import { requireOrgAccess } from '@/lib/org-context-server';
import { CreateProjectForm } from './create-project-form';

interface CreateProjectPageProps {
  params: Promise<{ orgSlug: string }>;
}

export default async function CreateProjectPage({
  params,
}: CreateProjectPageProps) {
  const { orgSlug } = await params;
  const { org } = await requireOrgAccess(orgSlug);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground mt-2">
          Add a new project to organize volunteer activities and track progress.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the information below to create a new project.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateProjectForm organizationId={org.id} />
        </CardContent>
      </Card>
    </div>
  );
}
