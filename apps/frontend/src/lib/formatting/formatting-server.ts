import { getLocale } from 'next-intl/server';
import { formats } from './formats';

export async function getFormatting() {
  const locale = await getLocale();
  return formats(locale);
}
