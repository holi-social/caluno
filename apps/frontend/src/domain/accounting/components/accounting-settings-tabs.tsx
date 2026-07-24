'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { RatesSectionCard } from './rates-section-card';
import { TemplateListingPage } from './template/listing-page';
import type { TemplateSectionData } from './template/types';

const MOCK_SECTIONS: TemplateSectionData[] = [
  {
    pauschale: 'ehrenamt',
    slots: [
      {
        slug: 'ehrenamtspauschale-contract',
        pauschale: 'ehrenamt',
        kind: 'contract',
        configured: true,
        summary: {
          task: 'Betreuung von Kindern und Jugendlichen bei Freizeitaktivitäten',
          hourlyRate: '4,50',
        },
        lastEditedAt: '2026-07-18T10:30:00Z',
        lastEditedBy: 'Julia Bauer',
      },
      {
        slug: 'ehrenamtspauschale-invoice',
        pauschale: 'ehrenamt',
        kind: 'invoice',
        configured: false,
      },
    ],
  },
  {
    pauschale: 'uebungleiter',
    slots: [
      {
        slug: 'uebungsleiterpauschale-contract',
        pauschale: 'uebungleiter',
        kind: 'contract',
        configured: false,
      },
      {
        slug: 'uebungsleiterpauschale-invoice',
        pauschale: 'uebungleiter',
        kind: 'invoice',
        configured: true,
        summary: {
          kostenstelle: 'K-4200',
          invoiceNumberFormat: 'kostenstelle-month-year-number',
        },
        lastEditedAt: '2026-06-02T14:15:00Z',
        lastEditedBy: 'Jonas Weber',
      },
    ],
  },
];

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
        <RatesSectionCard canEdit={canEditRates} />
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
            sections={MOCK_SECTIONS}
            orgUId={orgUId}
            builderBasePath={builderBasePath}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
