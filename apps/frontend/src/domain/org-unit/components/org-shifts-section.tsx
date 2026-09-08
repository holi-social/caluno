import { getLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import { OrgShiftsList } from './org-shifts-list';

interface OrgShiftsSectionProps {
  orgUId: string;
}

export const OrgShiftsSection = async ({ orgUId }: OrgShiftsSectionProps) => {
  const locale = await getLocale();
  const data = await getDataClient({ locale: resolveLocale(locale) });
  const shifts = await data.publicOrganizationUnit.findIndividualShifts(orgUId);

  return <OrgShiftsList shifts={shifts} />;
};
