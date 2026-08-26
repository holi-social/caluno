export const CURRENT_PRIVACY_POLICY_VERSION = '2026-08-25';

export class PrivacyPolicyAcceptanceError extends Error {
  constructor() {
    super('Privacy policy must be accepted');
    this.name = 'PrivacyPolicyAcceptanceError';
  }
}

export function applyPrivacyPolicyAcceptance<T extends object>(
  user: T & {
    privacyPolicyVersion?: string | null;
    privacyPolicyAcceptedAt?: Date | null;
  },
  acceptedAt = new Date(),
): T & {
  privacyPolicyVersion: string;
  privacyPolicyAcceptedAt: Date;
} {
  if (user.privacyPolicyVersion !== CURRENT_PRIVACY_POLICY_VERSION) {
    throw new PrivacyPolicyAcceptanceError();
  }

  return {
    ...user,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
    privacyPolicyAcceptedAt: acceptedAt,
  };
}
