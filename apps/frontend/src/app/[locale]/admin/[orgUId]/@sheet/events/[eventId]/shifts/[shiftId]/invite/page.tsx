import { notFound } from 'next/navigation';
import { InviteShiftPageContent } from '@/domain/shift/components/invite-shift-page-content';

interface InviteEventShiftPageProps {
  params: Promise<{
    orgUId: string;
    eventId: string;
    shiftId: string;
    locale: string;
  }>;
  searchParams: Promise<{ instanceId?: string }>;
}

export default async function InviteEventShiftPage({
  params,
  searchParams,
}: InviteEventShiftPageProps) {
  const { orgUId, eventId, shiftId, locale } = await params;
  const { instanceId } = await searchParams;
  if (!instanceId) {
    notFound();
  }

  return (
    <InviteShiftPageContent
      orgUId={orgUId}
      shiftId={shiftId}
      instanceId={instanceId}
      locale={locale}
      eventId={eventId}
    />
  );
}
