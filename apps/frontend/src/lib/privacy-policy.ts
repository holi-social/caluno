import { API_URL } from '@/lib/constants';

export const PRIVACY_POLICY_PDF_URL = `${API_URL}/legal/privacy-policy.pdf`;

export function buildSignupPayload(input: {
  name: string;
  email: string;
  password: string;
  privacyAccepted: boolean;
}): {
  name: string;
  email: string;
  password: string;
  privacyPolicyAccepted: true;
} | null {
  if (!input.privacyAccepted) {
    return null;
  }

  return {
    name: input.name,
    email: input.email,
    password: input.password,
    privacyPolicyAccepted: true,
  };
}
