import { getFormatter, getLocale } from 'next-intl/server';
import { formats } from './formats';

export async function getFormatting() {
  const formatter = await getFormatter();
  const locale = await getLocale();
  return formats(formatter, locale);
}
