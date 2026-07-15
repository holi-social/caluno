'use client';

import type { Locale } from '@repo/data';
import { useUpdateUserLocale } from '@repo/data/react';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { saveLocalePreference } from '@/lib/save-locale-preference';

const locales = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
] as const;

function isLocale(value: string): value is Locale {
  return locales.some(({ key }) => key === value);
}

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const updateLocale = useUpdateUserLocale();
  const [selected, setSelected] = useState<Locale>(locale as Locale);
  const selectedLabel =
    locales.find(({ key }) => key === selected)?.label ?? selected;

  useEffect(() => {
    setSelected(locale as Locale);
  }, [locale]);

  const handleSelect = (value: string) => {
    if (isLocale(value)) {
      setSelected(value);
    }
  };

  const handleSave = () =>
    saveLocalePreference({
      selected,
      current: locale,
      updateLocale: (next) => updateLocale.mutateAsync(next),
      navigate: (next) => router.replace(pathname, { locale: next }),
    });

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="locale">{t('LocaleSwitcher.label')}</Label>
        <Select value={selected} onValueChange={handleSelect}>
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
      <Button onClick={handleSave} disabled={selected === locale}>
        {t('Common.save')}
      </Button>
    </div>
  );
}
