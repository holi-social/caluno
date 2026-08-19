'use client';

import { Tabs, TabsList, TabsTrigger } from '@repo/ui';
import { CalendarRange, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { eventDetailPath } from '@/domain/event/routes';
import { useRouter } from '@/i18n/navigation';

export type EventDetailTab = 'shifts' | 'volunteers';

interface EventDetailTabSwitcherProps {
  orgUId: string;
  eventId: string;
  activeTab: EventDetailTab;
  week?: string;
}

export function EventDetailTabSwitcher({
  orgUId,
  eventId,
  activeTab,
  week,
}: EventDetailTabSwitcherProps) {
  const router = useRouter();
  const t = useTranslations('Event.detail.tabs');

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams();
    params.set('tab', value);
    if (week && value === 'shifts') {
      params.set('week', week);
    }
    router.push(`${eventDetailPath(orgUId, eventId)}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList className="h-10 group-data-[orientation=horizontal]/tabs:h-10">
        <TabsTrigger value="shifts" className="text-base px-3">
          <CalendarRange />
          {t('shifts')}
        </TabsTrigger>
        <TabsTrigger value="volunteers" className="text-base px-3">
          <Users />
          {t('volunteers')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
