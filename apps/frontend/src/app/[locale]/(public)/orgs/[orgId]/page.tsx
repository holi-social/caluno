import { type DataClient, DataError, JoinStatus } from '@repo/data';
import { CalendarCheckIcon, MapPinIcon, UsersIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DetailHero } from '@/components/detail-hero';
import { OrgEventsList } from '@/domain/org-unit/components/org-events-list';
import { OrgJoinButton } from '@/domain/org-unit/components/org-join-button';
import { OrgPageHeader } from '@/domain/org-unit/components/org-page-header';
import { OrgShiftsList } from '@/domain/org-unit/components/org-shifts-list';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';

interface OrgPageProps {
  params: Promise<{ orgId: string; locale: string }>;
}

type PublicOrganizationUnit = Awaited<
  ReturnType<DataClient['publicOrganizationUnit']['findById']>
>;

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');

export async function generateMetadata({ params }: OrgPageProps) {
  const { orgId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  let org: PublicOrganizationUnit;
  try {
    org = await data.publicOrganizationUnit.findById(orgId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    return { title: 'Organization — Clippy' };
  }
  return { title: `${org.name} — Clippy` };
}

export default async function OrgPage({ params }: OrgPageProps) {
  const { orgId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  const t = await getTranslations('OrgDetail');

  let org: PublicOrganizationUnit;
  try {
    org = await data.publicOrganizationUnit.findById(orgId);
  } catch (error) {
    if (error instanceof DataError && error.options?.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }

  const [events, shifts] = await Promise.all([
    data.publicOrganizationUnit.findEvents(orgId),
    data.publicOrganizationUnit.findIndividualShifts(orgId),
  ]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-x-0 top-0 z-10">
        <OrgPageHeader logoUrl={org.logoUrl} />
      </div>

      <DetailHero
        title={org.name}
        coverImageUrl={org.coverUrl}
        coverImageAlt={t('coverImageAlt', { title: org.name })}
        logo={{ url: org.logoUrl, initials: getInitials(org.name) }}
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
          <div className="order-2 flex flex-col gap-8 lg:order-1 lg:w-[680px]">
            <OrgEventsList events={events} />
            <OrgShiftsList shifts={shifts} />
          </div>

          <aside className="order-1 flex-1 lg:order-2 lg:w-[392px]">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <p className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <UsersIcon className="size-4 shrink-0" />
                  {t('memberCount', { n: org.memberCount })}
                </p>
                <p className="flex items-center gap-1.5 text-base text-muted-foreground">
                  <CalendarCheckIcon className="size-4 shrink-0" />
                  {t('openShiftsCount', { n: org.openShiftsCount })}
                </p>
              </div>
              {org.address ? (
                <p className="flex items-start gap-2 whitespace-pre-line text-base text-foreground">
                  <MapPinIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {org.address}
                </p>
              ) : null}
              {org.myMembershipState !== JoinStatus.Joined ? (
                <>
                  <hr className="border-border" />
                  <OrgJoinButton
                    organizationUnitId={org.id}
                    initialStatus={org.myMembershipState}
                  />
                </>
              ) : null}
            </div>

            {org.description ? (
              <section className="mt-6">
                <h2 className="text-xl font-bold text-foreground">
                  {t('aboutHeading')}
                </h2>
                <p className="mt-2 whitespace-pre-line text-lg text-muted-foreground">
                  {org.description}
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
