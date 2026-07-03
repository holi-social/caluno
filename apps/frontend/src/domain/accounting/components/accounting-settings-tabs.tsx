'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { TemplateListingPage } from './template/listing-page';
import type { TemplateSectionData } from './template/types';
import { RatesSectionCard } from './rates-section-card';

const MOCK_SECTIONS: TemplateSectionData[] = [
  {
    pauschale: 'ehrenamt',
    slots: [
      {
        slug: 'ehrenamtspauschale-contract',
        pauschale: 'ehrenamt',
        kind: 'contract',
        configured: true,
        signees: [
          { id: 's1', role: 'volunteer' },
          { id: 's2', role: 'coordinator' },
        ],
        blockedActions: [{ id: 'a1', gate: 'check_in' }],
      },
      {
        slug: 'ehrenamtspauschale-invoice',
        pauschale: 'ehrenamt',
        kind: 'invoice',
        configured: false,
        signees: [],
        blockedActions: [],
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
        signees: [],
        blockedActions: [],
      },
      {
        slug: 'uebungsleiterpauschale-invoice',
        pauschale: 'uebungleiter',
        kind: 'invoice',
        configured: false,
        signees: [],
        blockedActions: [],
      },
    ],
  },
];

interface AccountingSettingsTabsProps {
  orgUId: string;
  canEditRates?: boolean;
}

export function AccountingSettingsTabs({
  orgUId,
  canEditRates = true,
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
          <TemplateListingPage sections={MOCK_SECTIONS} orgUId={orgUId} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
