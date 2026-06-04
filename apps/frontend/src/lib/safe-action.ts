import { DataError } from '@repo/data';
import { createSafeActionClient } from 'next-safe-action';

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof DataError) return e.message;
    return 'Something went wrong';
  },
});
