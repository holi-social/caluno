'use client';

import {
  MembershipRequestStatus,
  useAdminUserProfile,
  useFormSubmissionsForVolunteer,
  useOrgUId,
  useUser,
} from '@repo/data/react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
} from '@repo/ui';
import { ExternalLink, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSheet } from '@/hooks/use-sheet';
import { Link } from '@/i18n/navigation';

function statusVariant(
  status: MembershipRequestStatus,
): 'default' | 'secondary' | 'destructive' {
  if (status === MembershipRequestStatus.Pending) return 'secondary';
  if (status === MembershipRequestStatus.Rejected) return 'destructive';
  return 'default';
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground w-24 shrink-0">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function statusLabel(
  t: ReturnType<typeof useTranslations<'MembershipRequest.status'>>,
  status: MembershipRequestStatus,
) {
  switch (status) {
    case MembershipRequestStatus.Pending:
      return t('pending');
    case MembershipRequestStatus.Rejected:
      return t('rejected');
    case MembershipRequestStatus.Accepted:
      return t('approved');
    default:
      return t('pending');
  }
}

function VolunteerSheetContent({
  userId,
  name,
  status,
  email,
  checkInId,
}: {
  userId: string;
  name: string;
  status: MembershipRequestStatus;
  email: string;
  checkInId: string;
}) {
  const t = useTranslations('Volunteer.sheet');
  const tCommon = useTranslations('Common');
  const tStatus = useTranslations('MembershipRequest.status');
  const orgUId = useOrgUId();
  const { data: user, isPending: userPending } = useUser(userId);
  const { data: userProfile, isPending: profilePending } =
    useAdminUserProfile(userId);
  const { data: submissions, isPending: submissionsPending } =
    useFormSubmissionsForVolunteer(userId);

  const profileData = (userProfile?.data ?? {}) as Record<string, unknown>;
  const address =
    typeof profileData.address === 'string' ? profileData.address : null;
  const birthday =
    typeof profileData['birth-date'] === 'string'
      ? profileData['birth-date']
      : null;

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex items-center gap-4">
        {userPending ? (
          <Skeleton className="size-10 rounded-full" />
        ) : (
          <Avatar size="lg">
            <AvatarImage
              src={user?.image ?? undefined}
              alt={tCommon('avatarAlt', { name: user?.name ?? name })}
            />
            <AvatarFallback>
              <UserRound className="size-6" />
            </AvatarFallback>
          </Avatar>
        )}
        <Badge variant={statusVariant(status)}>
          {statusLabel(tStatus, status)}
        </Badge>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t('userInfo')}
        </p>
        {profilePending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
        ) : (
          <div className="space-y-2">
            <InfoRow label={t('emailLabel')} value={email} />
            {address && <InfoRow label={t('addressLabel')} value={address} />}
            {birthday && (
              <InfoRow label={t('birthdayLabel')} value={birthday} />
            )}
            <InfoRow label={t('qrIdLabel')} value={checkInId} />
          </div>
        )}
      </div>

      <Separator />

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          {t('submittedForms')}
        </p>
        {submissionsPending ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('noSubmissions')}</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((submission) => (
              <Link
                key={submission.id}
                href={`/admin/${orgUId}/volunteers/form-submission/${submission.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <span>{submission.form?.name ?? t('formFallback')}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VolunteerSheet() {
  const t = useTranslations('Volunteer.sheet');
  const { isOpen, close, getParam } = useSheet(
    'volunteer-profile',
    'userId',
    'volunteerName',
    'volunteerStatus',
    'volunteerEmail',
    'volunteerCheckInId',
  );

  const userId = getParam('userId') ?? '';
  const name = getParam('volunteerName') ?? '';
  const status =
    (getParam('volunteerStatus') as MembershipRequestStatus) ??
    MembershipRequestStatus.Pending;
  const email = getParam('volunteerEmail') ?? '';
  const checkInId = getParam('volunteerCheckInId') ?? '';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>{name || t('titleFallback')}</SheetTitle>
        </SheetHeader>

        <div className="px-6 pb-10 flex-1">
          {isOpen && userId && (
            <VolunteerSheetContent
              userId={userId}
              name={name}
              status={status}
              email={email}
              checkInId={checkInId}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
