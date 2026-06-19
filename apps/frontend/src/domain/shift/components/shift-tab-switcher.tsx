'use client';

import { Tabs, TabsList, TabsTrigger } from '@repo/ui';
import { CalendarRange, Table as TableIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface Props {
  orgUId: string;
  activeTab: 'weekplan' | 'shifts';
  week?: string;
}

export function ShiftTabSwitcher({ orgUId, activeTab, week }: Props) {
  const router = useRouter();
  const t = useTranslations('Shift');

  const handleTabChange = (value: string) => {
    if (value === 'weekplan') {
      router.push(
        `/admin/${orgUId}/shifts?view=weekplan${week ? `&week=${week}` : ''}`,
      );
    } else {
      router.push(`/admin/${orgUId}/shifts?view=shifts`);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="weekplan">
          <CalendarRange />
          {t('tabs.weekplan')}
        </TabsTrigger>

        <TabsTrigger value="shifts">
          <TableIcon />
          {t('tabs.allShifts')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
