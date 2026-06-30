import { getFormatter } from 'next-intl/server';
import { formats } from './formats';

export async function getFormatting() {
  const formatter = await getFormatter();
  return formats(formatter);
}
