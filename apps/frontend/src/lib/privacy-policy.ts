/** Must match `CURRENT_PRIVACY_POLICY_VERSION` in apps/backend/src/auth/privacy-policy.ts */
export const PRIVACY_POLICY_VERSION = '2026-08-25';

export const PRIVACY_POLICY_PDF_PATH = `/legal/datenschutzhinweise-${PRIVACY_POLICY_VERSION}.pdf`;

export function buildSignupPayload(input: {
  name: string;
  email: string;
  password: string;
  privacyAccepted: boolean;
}): {
  name: string;
  email: string;
  password: string;
  privacyPolicyVersion: string;
} | null {
  if (!input.privacyAccepted) {
    return null;
  }

  return {
    name: input.name,
    email: input.email,
    password: input.password,
    privacyPolicyVersion: PRIVACY_POLICY_VERSION,
  };
}
