'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { RatesSectionCard } from './rates-section-card';
import { TemplateListingPage } from './template/listing-page';

interface AccountingSettingsTabsProps {
  orgUId: string;
  canEditRates?: boolean;
  builderBasePath?: string;
}

const TAB_PARAM = 'tab';
const TAB_VALUES = ['rates', 'templates'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: string | null): value is TabValue {
  return TAB_VALUES.includes(value as TabValue);
}

export function AccountingSettingsTabs({
  orgUId,
  canEditRates = true,
  builderBasePath = `/admin/${orgUId}/accounting/settings/templates`,
}: AccountingSettingsTabsProps) {
  const tTabs = useTranslations('Accounting.settings.tabs');
  const t = useTranslations('Accounting.settings.templates');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab: TabValue = isTabValue(searchParams.get(TAB_PARAM))
    ? (searchParams.get(TAB_PARAM) as TabValue)
    : 'rates';

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, value);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
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
