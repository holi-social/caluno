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

interface VolunteersPageProps {
  params: Promise<{ orgUId: string }>;
}

export default async function VolunteersPage({ params }: VolunteersPageProps) {
  const { orgUId } = await params;

  const { org } = await requireOrgAccess(orgUId);
  const data = await getDataClient(orgUId);

  const orgUUrl = organizationUnitUrl(orgUId);

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
          text="Copy organization unit link"
          copyText={orgUUrl}
          toastMessage="Organization unit link copied to clipboard"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {volunteers.map((volunteer) => (
              <TableRow key={volunteer.id}>
                <TableCell>{volunteer.name}</TableCell>
                <TableCell>{volunteer.email}</TableCell>
                <TableCell>
                  <Link
                    href={`/${orgUId}/check-in/${volunteer.checkInId}/check-in`}
                    aria-label="Check-in volunteer"
                  >
                    <Button size="icon-xs" variant="outline" aria-label='Check-in the volunteer to a shift'>
                      <LogIn />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
