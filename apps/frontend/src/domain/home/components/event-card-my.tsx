'use client';

import type { MyEvent } from '@repo/data/react';
import { Card, cn } from '@repo/ui';
import { CalendarDaysIcon, ChevronRightIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useFormatting } from '@/lib/formatting/use-formatting';
import { getInitials } from '@/lib/get-initials';

export interface EventCardMyProps {
  event: MyEvent;
}

export function EventCardMy({ event }: EventCardMyProps) {
  const t = useTranslations('VolunteerHome');
  const { formatDateRange } = useFormatting();
  const orgName = event.organizationUnit?.name ?? '';
  const orgLogoUrl = event.organizationUnit?.logoUrl;

  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <Card
        className={cn(
          'relative flex h-full w-full flex-col justify-end gap-3 overflow-hidden rounded-xl border border-border p-2',
          !event.coverUrl && 'bg-muted',
        )}
      >
        {event.coverUrl && (
          <>
            <Image
              src={event.coverUrl}
              alt=""
              fill
              unoptimized
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to top, var(--background) 0%, color-mix(in oklch, var(--background) 60%, transparent) 65%, color-mix(in oklch, var(--background) 10%, transparent) 100%)',
              }}
            />
          </>
        )}

        {/* Guarantees a minimum reveal of the cover image above the text —
            `justify-end` on the card then pushes this whole stack (spacer
            included) down further when the card is stretched taller than
            its content, per the npk49 fill-height rule. */}
        <div aria-hidden="true" className="relative z-10 h-8 w-full shrink-0" />

        <div className="relative z-10 flex flex-col gap-2">
          <p className="text-base font-semibold text-foreground">
            {formatDateRange(event.startsAt, event.endsAt)}
          </p>
          <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
            {event.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded bg-primary text-primary-foreground">
              {orgLogoUrl ? (
                <Image
                  src={orgLogoUrl}
                  alt=""
                  fill
                  unoptimized
                  sizes="24px"
                  className="object-cover"
                />
              ) : (
                <span className="text-[10px] font-bold">
                  {getInitials(orgName)}
                </span>
              )}
            </div>
            <span className="truncate text-sm font-medium text-muted-foreground">
              {orgName}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-1.5 rounded-full bg-muted-foreground px-2.5 py-[5px] text-muted">
          <span className="flex items-center gap-1 text-sm font-medium">
            <CalendarDaysIcon className="size-3.5 shrink-0" />
            {t('yourShiftsCount', { n: event.shiftsCount })}
          </span>
          <ChevronRightIcon className="size-3.5 shrink-0" />
        </div>
      </Card>
    </Link>
  );
}
