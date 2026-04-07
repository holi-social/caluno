import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui';
import { LogIn } from 'lucide-react';
import Link from 'next/link';
import { ButtonClipboard } from '@/components/button-clipboard';
import { organizationUnitUrl } from '@/domain/organization/share';
import { getDataClient } from '@/lib/data-client';
import { requireOrgAccess } from '@/lib/org-context-server';
import { EmptyVolunteers } from '@/domain/volunteer/empty-volunteers';

interface VolunteersPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function VolunteersPage({ params }: VolunteersPageProps) {
  const { orgUId } = await params;

  const { org } = await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const orgUnitUrl = organizationUnitUrl(orgUId);

  const volunteers = await data.organization.findVolunteers(org.organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Volunteers</h1>
          <p className="text-muted-foreground mt-1">
            Manage volunteers in your organization
          </p>
        </div>

        <ButtonClipboard
          text="Copy invite link"
          copyText={orgUnitUrl}
          toastMessage="Invite link copied to clipboard"
        />
      </div>

    {volunteers.length > 0 ? 
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers?.map((volunteer) => (
              <TableRow key={volunteer.id}>
                <TableCell>{volunteer.name}</TableCell>
                <TableCell>{volunteer.email}</TableCell>
                <TableCell>
                  <Link
                    href={`/${orgUId}/check-in/${volunteer.checkInId}/check-in`}
                    aria-label="Check-in volunteer"
                  >
                    <Button size="icon-xs" variant="outline">
                      <LogIn />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      :
      <EmptyVolunteers orgUnitUrl={orgUnitUrl} />
    }
    </div>
  );
}
