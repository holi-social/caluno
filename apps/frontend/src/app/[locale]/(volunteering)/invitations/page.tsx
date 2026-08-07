import { ShiftInviteStatus } from '@repo/data';
import { Empty, EmptyMedia, EmptyTitle } from '@repo/ui';
import { MailIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ShiftCardMyInvited } from '@/domain/home/components/shift-card-my-invited';
import { getDataClient } from '@/lib/data-client';

interface InvitationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function InvitationsPage({
  params,
}: InvitationsPageProps) {
  await params;
  const client = await getDataClient();
  const page = await client.shift.findMyShiftInstances({
    statuses: [ShiftInviteStatus.Invited],
    limit: 50,
  });
  const t = await getTranslations('VolunteerHome');

  return (
    <div className="mx-auto w-full max-w-4xl px-6 pt-6 pb-4">
      <h1 className="mb-4 text-2xl font-semibold text-foreground">
        {t('invitationsHeading')}
      </h1>
      {page.items.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <MailIcon />
          </EmptyMedia>
          <EmptyTitle>{t('invitationsEmpty')}</EmptyTitle>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          {page.items.map((invite) => (
            <ShiftCardMyInvited key={invite.id} shiftInstance={invite} />
          ))}
        </div>
      )}
    </div>
  );
}
