import { CreateForm } from '@/domain/requirement-form/components/create-form';
import { requireOrgAccess } from '@/lib/org-context-server';

interface Props {
  params: Promise<{ orgUId: string }>;
}

export default async function NewFormPage({ params }: Props) {
  const { orgUId } = await params;
  const { org } = await requireOrgAccess(orgUId);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="page-title">Create Requirement Form</h1>
        <p className="text-muted-foreground mt-1">
          Create a new form to collect information from volunteers.
        </p>
      </div>

      <CreateForm orgUId={orgUId} organizationId={org.organizationId} />
    </div>
  );
}
