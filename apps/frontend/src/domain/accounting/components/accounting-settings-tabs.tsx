'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { LifecycleSectionCard } from './lifecycle-section-card';
import { RatesSectionCard } from './rates-section-card';

interface AccountingSettingsTabsProps {
  canEditRates?: boolean;
}

export function AccountingSettingsTabs({
  canEditRates = true,
}: AccountingSettingsTabsProps) {
  const t = useTranslations('Accounting.settings.tabs');

  return (
    <Tabs defaultValue="rates">
      <TabsList>
        <TabsTrigger value="rates">{t('rates')}</TabsTrigger>
        <TabsTrigger value="lifecycle">{t('lifecycle')}</TabsTrigger>
      </TabsList>

      <TabsContent value="rates" className="mt-6">
        <RatesSectionCard canEdit={canEditRates} />
      </TabsContent>

      <TabsContent value="lifecycle" className="mt-6">
        <LifecycleSectionCard />
      </TabsContent>
    </Tabs>
  );
}
