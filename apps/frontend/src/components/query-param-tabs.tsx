'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export interface StatusTab<T> {
  value: string;
  label: string;
  items: T[];
}

interface Props<T> {
  tabs: StatusTab<T>[];
  activeTab: string;
  searchParamName: string;
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

export function QueryParamTabs<T extends { id: string }>({
  tabs,
  activeTab,
  renderItem,
  searchParamName,
  emptyMessage = 'No items yet.',
}: Props<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(searchParamName, value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          <div className="flex flex-col gap-4">
            {tab.items.length === 0 ? (
              <p className="text-muted-foreground">{emptyMessage}</p>
            ) : (
              tab.items.map((item) => renderItem(item))
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
