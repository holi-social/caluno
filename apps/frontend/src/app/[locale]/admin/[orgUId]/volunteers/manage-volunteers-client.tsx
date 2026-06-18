'use client';

import {
  MembershipRequestStatus,
  useMembershipRequests,
  useMemberships,
} from '@repo/data/react';
import {
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui';
import { LogIn, UserRound } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { ButtonClipboard } from '@/components/button-clipboard';
import MembershipRequestCard from '@/domain/membership-requests/components/membership-request-card';
import { organizationUnitUrl } from '@/domain/organization/share';
import { EmptyVolunteers } from '@/domain/volunteer/empty-volunteers';
import { useSheetTrigger } from '@/hooks/use-sheet';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { RoleSelectCell } from './role-select-cell';

const TAB_APPROVED = 'APPROVED';
const TAB_PENDING = MembershipRequestStatus.Pending;
const TAB_REJECTED = MembershipRequestStatus.Rejected;

const TABS = [
  { value: TAB_APPROVED, label: 'Approved' },
  { value: TAB_PENDING, label: 'Pending' },
  { value: TAB_REJECTED, label: 'Rejected' },
];

interface Props {
  orgUId: string;
}

function ApprovedTab({ orgUId }: { orgUId: string }) {
  const { data, isPending } = useMemberships(orgUId);
  const { open: openVolunteerSheet } = useSheetTrigger('volunteer-profile');

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const memberships = data ?? [];

  if (memberships.length === 0) {
    return (
      <EmptyVolunteers>
        <ButtonClipboard
          text="Copy invite link"
          copyText={organizationUnitUrl(orgUId)}
          toastMessage="Invite link copied to clipboard"
        />
      </EmptyVolunteers>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((membership) => (
            <TableRow key={membership.id}>
              <TableCell>{membership.user.name}</TableCell>
              <TableCell>{membership.user.email}</TableCell>
              <TableCell>
                <RoleSelectCell
                  membershipId={membership.id}
                  roles={membership.roles}
                  orgUId={orgUId}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-xs"
                    variant="outline"
                    aria-label="View volunteer profile"
                    onClick={() =>
                      openVolunteerSheet({
                        userId: membership.user.id,
                        volunteerName: membership.user.name,
                        volunteerStatus: MembershipRequestStatus.Accepted,
                        volunteerEmail: membership.user.email,
                        volunteerCheckInId: membership.user.checkInId,
                      })
                    }
                  >
                    <UserRound />
                  </Button>
                  <Link
                    href={`/admin/${orgUId}/check-in/${membership.user.checkInId}/check-in`}
                    aria-label="Check-in volunteer"
                  >
                    <Button
                      size="icon-xs"
                      variant="outline"
                      aria-label="Check-in the volunteer to a shift"
                    >
                      <LogIn />
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function RequestsTab({
  orgUId,
  status,
}: {
  orgUId: string;
  status: MembershipRequestStatus;
}) {
  const { data, isPending } = useMembershipRequests(orgUId, status);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const requests = data?.items ?? [];

  if (requests.length === 0) {
    return (
      <p className="text-muted-foreground">
        No {status.toLowerCase()} requests yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {requests.map((request) => (
        <MembershipRequestCard key={request.id} request={request} />
      ))}
    </div>
  );
}

export default function ManageVolunteersClient({ orgUId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('status') ?? TAB_APPROVED;

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const orgUnitUrl = organizationUnitUrl(orgUId);

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

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={TAB_APPROVED} className="mt-4">
          <ApprovedTab orgUId={orgUId} />
        </TabsContent>

        <TabsContent value={TAB_PENDING} className="mt-4">
          <RequestsTab orgUId={orgUId} status={TAB_PENDING} />
        </TabsContent>

        <TabsContent value={TAB_REJECTED} className="mt-4">
          <RequestsTab orgUId={orgUId} status={TAB_REJECTED} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
