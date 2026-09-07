import { redirect } from '@/i18n/navigation';

type CheckInPageProps = {
  params: Promise<{ locale: string; checkInId: string }>;
};

// TEMP-CHECKIN-MIGRATION: legacy QR target; the decide page on the
// volunteering side resolves the org unit itself now.
export default async function CheckInPage({ params }: CheckInPageProps) {
  const { locale, checkInId } = await params;
  redirect({ href: `/check-in/${checkInId}/decide`, locale });
}
