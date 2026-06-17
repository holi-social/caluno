'use client';

import { Tabs, TabsList, TabsTrigger } from '@repo/ui';
import { CalendarRange, Table as TableIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  orgUId: string;
  activeTab: 'weekplan' | 'shifts';
  week?: string;
}

export function ShiftTabSwitcher({ orgUId, activeTab, week }: Props) {
  const router = useRouter();

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
          Weekplan
        </TabsTrigger>

        <TabsTrigger value="shifts">
          <TableIcon />
          All shifts
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
