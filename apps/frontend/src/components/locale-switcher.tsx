'use client';

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

const locales = [
  { key: 'en', label: 'English' },
  { key: 'de', label: 'Deutsch' },
] as const;

export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const updateLocale = useUpdateUserLocale();
  const [selected, setSelected] = useState(locale);
  const selectedLabel =
    locales.find(({ key }) => key === selected)?.label ?? selected;

  useEffect(() => {
    setSelected(locale);
  }, [locale]);

  const handleSave = async () => {
    if (selected === locale) return;
    await updateLocale.mutateAsync(selected);
    router.replace(pathname, { locale: selected });
  };

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="locale">{t('LocaleSwitcher.label')}</Label>
        <Select value={selected} onValueChange={setSelected}>
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
