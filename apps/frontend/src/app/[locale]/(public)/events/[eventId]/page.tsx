import { type DataClient, DataError } from '@repo/data';
import { LayersIcon, MapPinIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { DetailHero } from '@/components/detail-hero';
import { EventFollowButton } from '@/domain/event/components/event-follow-button';
import { EventPageHeader } from '@/domain/event/components/event-page-header';
import { EventShiftsSection } from '@/domain/event/components/event-shifts-section';
import { getEventSpotsSummary } from '@/domain/event/lib/event-spots';
import { resolveLocale } from '@/i18n/routing';
import { getDataClient } from '@/lib/data-client';
import { getFormatting } from '@/lib/formatting/formatting-server';

interface EventPageProps {
  params: Promise<{ eventId: string; locale: string }>;
}

type PublicEvent = Awaited<ReturnType<DataClient['publicEvent']['findById']>>;

export async function generateMetadata({ params }: EventPageProps) {
  const { eventId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  let event: PublicEvent;
  try {
    event = await data.publicEvent.findById(eventId);
  } catch (error) {
    if (error instanceof DataError) {
      notFound();
    }
    return { title: 'Event — Clippy' };
  }
  return { title: `${event.title} — Clippy` };
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId, locale } = await params;
  const data = await getDataClient({ locale: resolveLocale(locale) });
  const { formatDateRange } = await getFormatting();
  const t = await getTranslations('EventDetail');

  let event: PublicEvent;
  try {
    event = await data.publicEvent.findById(eventId);
  } catch (error) {
    if (error instanceof DataError) {
      notFound();
    }
    throw error;
  }

  const spotsSummary = getEventSpotsSummary(event.shifts);
  const shiftsSummary =
    !spotsSummary.hasInstances || spotsSummary.hasUnlimited
      ? t('shiftsSummaryNoSpots', { shifts: event.shiftsCount })
      : spotsSummary.fullyBooked
        ? t('shiftsSummaryFull', { shifts: event.shiftsCount })
        : t('shiftsSummary', {
            shifts: event.shiftsCount,
            spotsLeft: spotsSummary.totalSpotsLeft,
          });

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute inset-x-0 top-0 z-10">
        <EventPageHeader logoUrl={event.organizationUnit?.logoUrl} />
      </div>

      <DetailHero
        title={event.title}
        coverImageUrl={event.coverImageUrl}
        coverImageAlt={t('coverImageAlt', { title: event.title })}
        badge={{ label: t('badge') }}
        org={
          event.organizationUnit
            ? {
                name: event.organizationUnit.name,
                href: `/orgs/${event.organizationUnit.id}`,
              }
            : null
        }
      />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-12">
          <div className="order-2 min-w-0 flex-1 lg:order-1 lg:max-w-[680px]">
            <EventShiftsSection
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              shifts={event.shifts}
            />
          </div>

          <aside className="order-1 min-w-0 lg:order-2 lg:w-[392px] lg:shrink-0">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-2xl font-bold text-foreground">
                {formatDateRange(event.startsAt, event.endsAt)}
              </p>
              {event.location ? (
                <p className="flex items-center gap-2 whitespace-pre-line text-base text-muted-foreground">
                  <MapPinIcon className="size-4 shrink-0" />
                  {event.location}
                </p>
              ) : null}
              <p className="flex items-center gap-2 text-base text-muted-foreground">
                <LayersIcon className="size-4 shrink-0" />
                {shiftsSummary}
              </p>
              <hr className="border-border" />
              <EventFollowButton
                eventId={event.id}
                initialStatus={event.myJoinStatus}
              />
            </div>

            {event.description ? (
              <section className="mt-6">
                <h2 className="text-xl font-bold text-foreground">
                  {t('aboutHeading')}
                </h2>
                <p className="mt-2 whitespace-pre-line text-lg text-muted-foreground">
                  {event.description}
                </p>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
