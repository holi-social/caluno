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
                    href={`/${orgId}/check-in/${volunteer.checkInId}`}
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
    </div>
  );
}
