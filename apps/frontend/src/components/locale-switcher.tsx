'use client';

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
import { useState } from 'react';
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
  const [selected, setSelected] = useState(locale);

  const handleSave = () => {
    if (selected === locale) return;
    router.replace(pathname, { locale: selected });
  };

  return (
    <div className="space-y-4 max-w-sm">
      <div className="space-y-2">
        <Label htmlFor="locale">{t('LocaleSwitcher.label')}</Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger id="locale">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locales.map(({ key, label }) => (
              <SelectItem key={key} value={key}>
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
