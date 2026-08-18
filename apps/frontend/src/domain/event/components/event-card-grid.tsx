'use client';

import type { EventListItem } from '@repo/data/react';
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@repo/ui';
import { PlusIcon, TicketIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { EventCard } from './event-card';

interface EventCardGridProps {
  events: EventListItem[];
  orgUId: string;
  canEdit: boolean;
}

export function EventCardGrid({ events, orgUId, canEdit }: EventCardGridProps) {
  const t = useTranslations('Event');

  if (events.length === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TicketIcon />
          </EmptyMedia>
          <EmptyTitle>{t('empty.title')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </EmptyHeader>
        {canEdit && (
          <EmptyContent>
            <Button asChild>
              <Link href={`/admin/${orgUId}/events/new`}>
                <PlusIcon />
                {t('list.createButton')}
              </Link>
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          orgUId={orgUId}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
