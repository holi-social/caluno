import { AccountingSettingsTabs } from '@/domain/accounting/components/accounting-settings-tabs';

export default function DevAccountingSettingsPreview() {
  return (
    <div className="py-10 px-8 space-y-6">
      <div>
        <h1 className="page-title">Accounting Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Dev preview — no auth required
        </p>
      </div>
      <AccountingSettingsTabs orgUId="dev-org" />
    </div>
  );
}
