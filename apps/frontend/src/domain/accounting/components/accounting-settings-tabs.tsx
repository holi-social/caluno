'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { RatesSectionCard } from './rates-section-card';
import { TemplateListingPage } from './template/listing-page';
import { MOCK_SAVED_TEMPLATES } from './template/mock-saved-templates';
import type { TemplateSectionData, TemplateSlot } from './template/types';
import { SLUG_TO_SLOT } from './template/types';

// Every slot reads the same saved-template store the creation modals render
// from — the settings cards and the generated documents can never disagree,
// since there's only one place either of them reads from.
function slot(slug: TemplateSlot['slug']): TemplateSlot {
  const { pauschale, kind } = SLUG_TO_SLOT[slug];
  const saved = MOCK_SAVED_TEMPLATES[slug];
  return {
    slug,
    pauschale,
    kind,
    configured: true,
    summary: saved.summary,
    lastEditedAt: saved.lastEditedAt,
    lastEditedBy: saved.lastEditedBy,
  };
}

const MOCK_SECTIONS: TemplateSectionData[] = [
  {
    pauschale: 'ehrenamt',
    slots: [
      slot('ehrenamtspauschale-contract'),
      slot('ehrenamtspauschale-invoice'),
    ],
  },
  {
    pauschale: 'uebungleiter',
    slots: [
      slot('uebungsleiterpauschale-contract'),
      slot('uebungsleiterpauschale-invoice'),
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
