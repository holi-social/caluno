'use client';

import { CalendarIcon, ChevronRightIcon } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import {
  type DiscoveryShiftInstance,
  ShiftCardDiscovery,
} from './shift-card-discovery';

export interface ShiftCardDiscoveryEventProps {
  shiftInstance: DiscoveryShiftInstance & {
    master: { event?: { title: string; coverImageUrl?: string | null } | null };
  };
  conflictsWithBooked?: boolean;
}

export function ShiftCardDiscoveryEvent({
  shiftInstance,
  conflictsWithBooked,
}: ShiftCardDiscoveryEventProps) {
  const t = useTranslations('VolunteerHome');
  const event = shiftInstance.master.event;

  const cover = (
    <div className="relative h-[120px] w-full bg-muted">
      {event?.coverImageUrl && (
        <Image
          src={event.coverImageUrl}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="100vw"
        />
      )}
      {event && (
        <div className="absolute left-3 top-3 flex max-w-[calc(100%-24px)] items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-sm font-medium text-white">
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">
            {t('partOfEvent', { event: event.title })}
          </span>
          <ChevronRightIcon className="size-4 shrink-0" />
        </div>
      )}
    </div>
  );

  return (
    <ShiftCardDiscovery
      shiftInstance={shiftInstance}
      conflictsWithBooked={conflictsWithBooked}
      cover={cover}
    />
  );
}
