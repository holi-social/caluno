import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ManualCheckInPage } from '@/domain/shift/components/manual-check-in/manual-check-in-page';
import { resolveInitialCheckInOrgUnit } from '@/domain/shift/resolve-initial-check-in-org-unit';
import { redirect } from '@/i18n/navigation';
import { getDataClient } from '@/lib/data-client';
import { getMyCheckInOrgUnits } from '@/lib/org-context-server';

interface VolunteeringCheckInPageProps {
  params: Promise<{ locale: string; checkInId: string }>;
  searchParams: Promise<{ orgUId?: string }>;
}

export default async function VolunteeringCheckInPage({
  params,
  searchParams,
}: VolunteeringCheckInPageProps) {
  const { locale, checkInId } = await params;
  setRequestLocale(locale);
  const { orgUId } = await searchParams;

  const data = await getDataClient();
  const [context, checkInOrgUnits] = await Promise.all([
    data.timeEntry.getCheckInContext(checkInId),
    getMyCheckInOrgUnits(),
  ]);

  if (!context) {
    notFound();
  }

  // `eligibleOrganizationUnits` is the caller's check-in units intersected
  // with the volunteer's memberships. Here it only orders the initial pick —
  // every check-in unit stays selectable.
  const initialOrgUnitId = resolveInitialCheckInOrgUnit({
    orgUnitIds: checkInOrgUnits.map((unit) => unit.id),
    memberOrgUnitIds: context.eligibleOrganizationUnits.map((unit) => unit.id),
    orgUIdParam: orgUId,
  });

  if (!initialOrgUnitId) {
    redirect({ href: '/check-in', locale });
    return;
  }

  return (
    <ManualCheckInPage
      volunteer={context.volunteer}
      orgUnits={checkInOrgUnits.map((unit) => ({
        id: unit.id,
        name: unit.name,
      }))}
      initialOrgUnitId={initialOrgUnitId}
    />
  );
}
