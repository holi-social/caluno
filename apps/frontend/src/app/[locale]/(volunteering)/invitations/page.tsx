import { EventInviteStatus, ShiftInviteStatus } from '@repo/data';
import { Empty, EmptyMedia, EmptyTitle } from '@repo/ui';
import { MailIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { EventCardMyInvited } from '@/domain/home/components/event-card-my-invited';
import { InvitationsPageHeader } from '@/domain/home/components/invitations-page-header';
import { ShiftCardMyInvited } from '@/domain/home/components/shift-card-my-invited';
import { mergeInvitations } from '@/domain/home/lib/merge-invitations';
import { requireAuth } from '@/lib/auth-server';
import { getDataClient } from '@/lib/data-client';

interface InvitationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function InvitationsPage({
  params,
}: InvitationsPageProps) {
  const { locale } = await params;
  await requireAuth(`/${locale}/auth/login`);
  const client = await getDataClient();
  const [shiftInvites, eventInvites] = await Promise.all([
    client.shift.findMyShiftInstances({
      statuses: [ShiftInviteStatus.Invited],
      limit: 50,
    }),
    client.event.findMyEvents({
      statuses: [EventInviteStatus.Invited],
      limit: 50,
    }),
  ]);
  const invitations = mergeInvitations(shiftInvites.items, eventInvites.items);
  const t = await getTranslations('VolunteerHome');

  return (
    <>
      <InvitationsPageHeader />
      <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-4">
        {invitations.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <MailIcon />
            </EmptyMedia>
            <EmptyTitle>{t('invitationsEmpty')}</EmptyTitle>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {invitations.map((invite) =>
              invite.kind === 'shift' ? (
                <ShiftCardMyInvited
                  key={`shift-${invite.id}`}
                  shiftInstance={invite.shift}
                />
              ) : (
                <EventCardMyInvited
                  key={`event-${invite.id}`}
                  event={invite.event}
                />
              ),
            )}
          </div>
        )}
      </div>
    </>
  );
}
