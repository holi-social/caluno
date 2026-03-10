import { notFound, redirect } from 'next/navigation';
import SendMembershipRequestButton from '@/domain/invite/components/send-membership-request-button';
import { isAuthenticated } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface InvitePageProps {
  params: Promise<{ orgId: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { orgId } = await params;

  if (!(await isAuthenticated())) {
    const searchParams = new URLSearchParams({ orgId });
    redirect(`/api/invite?${searchParams}`);
  }

  const data = await getDataClient();
  const org = await data.organization.findById(orgId);

  if (!org) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Request Membership</h1>

        <p>
          Pressing the button below will request membership to the {org.name}{' '}
          organization.
        </p>

        <SendMembershipRequestButton orgId={orgId} />
      </div>
    </div>
  );
}
