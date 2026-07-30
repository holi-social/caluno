'use client';

import type { Locale } from '@repo/data';
import { useUpdateUserLocale } from '@repo/data/react';
import {
  Button,
  FieldGroup,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { usePathname, useRouter } from '@/i18n/navigation';
import { saveLocalePreference } from '@/lib/save-locale-preference';

const locales = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
] as const;

function isLocale(value: string): value is Locale {
  return locales.some(({ key }) => key === value);
}

export function ProfileForm() {
  const t = useTranslations('Profile');
  const tLocale = useTranslations('LocaleSwitcher');
  const tCommon = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const updateLocale = useUpdateUserLocale();

  const [selectedLocale, setSelectedLocale] = useState<Locale>(
    locale as Locale,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedLocale(locale as Locale);
  }, [locale]);

  const hasChanges = selectedLocale !== locale;

  const selectedLabel =
    locales.find(({ key }) => key === selectedLocale)?.label ?? selectedLocale;

  const handleLocaleSelect = (value: string) => {
    if (isLocale(value)) {
      setSelectedLocale(value);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    try {
      await saveLocalePreference({
        selected: selectedLocale,
        current: locale,
        updateLocale: (next) => updateLocale.mutateAsync(next),
        navigate: (next) => router.replace(pathname, { locale: next }),
      });

      toast.success(t('saved'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const isPending = isSaving || updateLocale.isPending;

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
            <SelectValue>{selectedLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {locales.map(({ key, label }) => (
              <SelectItem key={key} value={key} textValue={label}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
