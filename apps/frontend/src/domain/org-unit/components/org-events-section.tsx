import { getLocale } from 'next-intl/server';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import { OrgEventsList } from './org-events-list';

interface OrgEventsSectionProps {
  orgUId: string;
}

export const OrgEventsSection = async ({ orgUId }: OrgEventsSectionProps) => {
  const locale = await getLocale();
  const data = await getDataClient({ locale: resolveLocale(locale) });
  const events = await data.publicOrganizationUnit.findEvents(orgUId);

  return <OrgEventsList events={events} />;
};
