import { redirect } from '@/i18n/navigation';

interface CheckinPageProps {
  params: Promise<{ locale: string; orgUId: string; checkInId: string }>;
}

// TEMP-CHECKIN-MIGRATION: keeps old per-org decide URLs working; the orgUId
// is forwarded so it stays the preferred check-in target.
export default async function DecidePage({ params }: CheckinPageProps) {
  const { locale, orgUId, checkInId } = await params;
  redirect({ href: `/check-in/${checkInId}/decide?orgUId=${orgUId}`, locale });
}
