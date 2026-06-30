import { useFormatter, useLocale } from 'next-intl';
import { formats } from './formats';

export function useFormatting() {
  const formatter = useFormatter();
  const locale = useLocale();
  return formats(formatter, locale);
}
