'use client';

import { JoinStatus } from '@repo/data';
import { useJoinOrganization } from '@repo/data/react';
import { Button } from '@repo/ui';
import { UserPlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { useSession } from '@/lib/auth';

interface OrgJoinButtonProps {
  organizationUnitId: string;
  initialStatus: JoinStatus;
}

export function OrgJoinButton({
  organizationUnitId,
  initialStatus,
}: OrgJoinButtonProps) {
  const t = useTranslations('OrgDetail');
  const router = useRouter();
  const session = useSession();
  const joinOrganization = useJoinOrganization();
  const [status, setStatus] = useState(initialStatus);

  const handleClick = useCallback(async () => {
    if (!session.data?.user) {
      const redirectTo = `/orgs/${organizationUnitId}`;
      window.location.href = `/api/invite?redirectTo=${encodeURIComponent(redirectTo)}`;
      return;
    }

    try {
      const result = await joinOrganization.mutateAsync(organizationUnitId);

      if (result.status === JoinStatus.RequirementsNeeded) {
        router.push(`/invite/${organizationUnitId}`);
        return;
      }

      setStatus(result.status);

      if (result.status === JoinStatus.Pending) {
        toast.success(t('requestSentToast'));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : undefined);
    }
  }, [session.data?.user, organizationUnitId, joinOrganization, router, t]);

  if (status === JoinStatus.Joined) {
    return null;
  }

  if (status === JoinStatus.Pending) {
    return (
      <div>
        <Button
          size="lg"
          variant="secondary"
          disabled
          className="h-11 w-full font-semibold"
        >
          {t('requestPending')}
        </Button>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {t('requestMembershipNote')}
        </p>
      </div>
    );
  }

  if (status === JoinStatus.Rejected) {
    return (
      <Button
        size="lg"
        variant="outline"
        disabled
        className="h-11 w-full font-semibold"
      >
        {t('requestRejected')}
      </Button>
    );
  }

  return (
    <div>
      <Button
        size="lg"
        onClick={handleClick}
        disabled={joinOrganization.isPending}
        className="h-11 w-full font-semibold"
      >
        <UserPlusIcon className="size-[18px]" />
        {t('requestMembership')}
      </Button>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t('requestMembershipNote')}
      </p>
    </div>
  );
}
