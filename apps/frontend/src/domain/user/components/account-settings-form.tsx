'use client';

import type { Locale } from '@repo/data';
import { useUpdateMyAccountSettings } from '@repo/data/react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  FieldGroup,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { LOCALES, localeLabel } from '@/i18n/locales';
import { usePathname, useRouter } from '@/i18n/navigation';
import { setLocaleCookie } from '@/lib/locale-cookie';

function isLocale(value: string): value is Locale {
  return LOCALES.some(({ key }) => key === value);
}

type EmailSettingField =
  | 'emailWeeklyUpdateEnabled'
  | 'emailUrgentCallsEnabled'
  | 'emailPlatformEnabled';

type AccountSettingsFormProps = {
  emailWeeklyUpdateEnabled: boolean;
  emailUrgentCallsEnabled: boolean;
  emailPlatformEnabled: boolean;
};

export function AccountSettingsForm({
  emailWeeklyUpdateEnabled,
  emailUrgentCallsEnabled,
  emailPlatformEnabled,
}: AccountSettingsFormProps) {
  const t = useTranslations('Profile');
  const tLocale = useTranslations('LocaleSwitcher');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const updateAccountSettings = useUpdateMyAccountSettings();

  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    locale as Locale,
  );
  const [emailSettings, setEmailSettings] = useState<
    Record<EmailSettingField, boolean>
  >({
    emailWeeklyUpdateEnabled,
    emailUrgentCallsEnabled,
    emailPlatformEnabled,
  });
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    selectedLocale !== locale ||
    emailSettings.emailWeeklyUpdateEnabled !== emailWeeklyUpdateEnabled ||
    emailSettings.emailUrgentCallsEnabled !== emailUrgentCallsEnabled ||
    emailSettings.emailPlatformEnabled !== emailPlatformEnabled;

  const handleLocaleSelect = (value: string) => {
    if (isLocale(value)) {
      setSelectedLocale(value);
    }
  };

  const handleToggle = (field: EmailSettingField, checked: boolean) => {
    setEmailSettings((previous) => ({ ...previous, [field]: checked }));
  };

  const handleSave = async () => {
    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    try {
      await updateAccountSettings.mutateAsync({
        locale: selectedLocale === locale ? null : selectedLocale,
        ...emailSettings,
      });

      if (selectedLocale !== locale) {
        setLocaleCookie(selectedLocale);
        router.replace(pathname, { locale: selectedLocale });
      }

      toast.success(t('accountSettingsSaved'));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('accountSettingsSaveFailed'),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isPending = isSaving || updateAccountSettings.isPending;

  const emailRows: { field: EmailSettingField; label: string }[] = [
    { field: 'emailWeeklyUpdateEnabled', label: t('emailWeeklyUpdate') },
    { field: 'emailUrgentCallsEnabled', label: t('emailUrgentCalls') },
    { field: 'emailPlatformEnabled', label: t('emailPlatform') },
  ];

  return (
    <FieldGroup className="max-w-md">
      <div className="space-y-2">
        <Label htmlFor="locale">{tLocale('label')}</Label>
        <Select
          value={selectedLocale}
          onValueChange={handleLocaleSelect}
          disabled={isPending}
        >
          <SelectTrigger id="locale">
            <SelectValue>{localeLabel(selectedLocale)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map(({ key, label }) => (
              <SelectItem key={key} value={key} textValue={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('emailSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailRows.map(({ field, label }) => (
            <div
              key={field}
              className="flex items-center justify-between gap-4"
            >
              <Label htmlFor={field}>{label}</Label>
              <Switch
                id={field}
                checked={emailSettings[field]}
                onCheckedChange={(checked) => handleToggle(field, checked)}
                disabled={isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        type="button"
        className="self-start"
        onClick={handleSave}
        disabled={!hasChanges || isPending}
      >
        {isPending ? tCommon('saving') : tCommon('save')}
      </Button>
    </FieldGroup>
  );
}
