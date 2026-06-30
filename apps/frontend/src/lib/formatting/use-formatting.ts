import { useFormatter } from 'next-intl';
import { formats } from './formats';

export function useFormatting() {
  const formatter = useFormatter();
  return formats(formatter);
}
