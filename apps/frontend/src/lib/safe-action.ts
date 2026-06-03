import { createSafeActionClient } from 'next-safe-action';
import { DataError } from '@repo/data';

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof DataError) return e.message;
    return 'Something went wrong';
  },
});
