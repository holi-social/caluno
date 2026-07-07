import { useLocale } from 'next-intl';
import { formats } from './formats';

export function useFormatting() {
  const locale = useLocale();
  return formats(locale);
}
