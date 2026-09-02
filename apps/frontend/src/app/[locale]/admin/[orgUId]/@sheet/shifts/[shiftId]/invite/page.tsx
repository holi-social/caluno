import { notFound } from 'next/navigation';
import { InviteShiftPageContent } from '@/domain/shift/components/invite-shift-page-content';

interface InviteShiftPageProps {
  params: Promise<{ orgUId: string; shiftId: string; locale: string }>;
  searchParams: Promise<{ instanceId?: string; flow?: string }>;
}

export default async function InviteShiftPage({
  params,
  searchParams,
}: InviteShiftPageProps) {
  const { orgUId, shiftId, locale } = await params;
  const { instanceId, flow } = await searchParams;
  if (!instanceId) {
    notFound();
  }

  return (
    <InviteShiftPageContent
      orgUId={orgUId}
      shiftId={shiftId}
      instanceId={instanceId}
      locale={locale}
      isCreationFlow={flow === 'create'}
    />
  );
}
