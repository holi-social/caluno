import { getTranslations } from 'next-intl/server';
import { AccountingSettingsTabs } from '@/domain/accounting/components/accounting-settings-tabs';

interface AccountingSettingsPageProps {
  params: Promise<{ orgUId: string; locale: string }>;
}

export default async function AccountingSettingsPage({
  params,
}: AccountingSettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Accounting' });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      <AccountingSettingsTabs />
    </div>
  );
}
