import { DataError } from '@repo/data';
import { getTranslations } from 'next-intl/server';
import { createSafeActionClient } from 'next-safe-action';

export const actionClient = createSafeActionClient({
  async handleServerError(e) {
    if (e instanceof DataError) return e.message;
    const t = await getTranslations('Error');
    return t('generic');
  },
});
