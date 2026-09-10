import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { formats } from './formats';

export function useFormatting() {
  const locale = useLocale();
  return useMemo(() => formats(locale), [locale]);
}
