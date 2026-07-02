import { createAuthClient } from '@repo/data/react';
import { API_URL } from '@/lib/constants';

export const auth = createAuthClient(API_URL);
export const {
  emailOtp,
  requestPasswordReset,
  resetPassword,
  signIn,
  signUp,
  signOut,
  useSession,
} = auth;
