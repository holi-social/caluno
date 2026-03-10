import { ButtonClipboard } from '@/components/button-clipboard';
import { organizationShareUrl } from '@/domain/organization/share';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';

interface VolunteersPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function VolunteersPage({ params }: VolunteersPageProps) {
  const { orgId } = await params;

  const { org } = await requireOrgAccess(orgId);
  const data = await getDataClient(org.id);

  const orgUrl = organizationShareUrl(org.id);

  const volunteers = await data.organization.findVolunteers(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Volunteers</h1>
          <p className="text-muted-foreground mt-1">
            Manage volunteers in your organization
          </p>
        </div>

        <ButtonClipboard
          text="Copy organization link"
          copyText={orgUrl}
          toastMessage="Organization link copied to clipboard"
        />
      </div>
    </div>
  );
}
