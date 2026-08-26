'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { RatesSectionCard } from './rates-section-card';
import { TemplateListingPage } from './template/listing-page';

interface AccountingSettingsTabsProps {
  orgUId: string;
  canEditRates?: boolean;
  builderBasePath?: string;
}

export function AccountingSettingsTabs({
  orgUId,
  canEditRates = true,
  builderBasePath = `/admin/${orgUId}/accounting/settings/templates`,
}: AccountingSettingsTabsProps) {
  const tTabs = useTranslations('Accounting.settings.tabs');
  const t = useTranslations('Accounting.settings.templates');

  return (
    <Tabs defaultValue="rates">
      <TabsList>
        <TabsTrigger value="rates">{tTabs('rates')}</TabsTrigger>
        <TabsTrigger value="templates">{tTabs('templates')}</TabsTrigger>
      </TabsList>

      <TabsContent value="rates" className="mt-6">
        <RatesSectionCard canEdit={canEditRates} organizationUnitId={orgUId} />
      </TabsContent>

      <TabsContent value="templates" className="mt-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">{t('sectionTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('sectionSubtitle')}
            </p>
          </div>
          <TemplateListingPage
            orgUId={orgUId}
            builderBasePath={builderBasePath}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
