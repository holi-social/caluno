export class PrivacyPolicyAcceptanceError extends Error {
  constructor() {
    super('Privacy policy must be accepted');
    this.name = 'PrivacyPolicyAcceptanceError';
  }
}

export function privacyPolicyAcceptedFromBody(body: unknown): boolean {
  if (!body || typeof body !== 'object') {
    return false;
  }

  return (
    (body as { privacyPolicyAccepted?: unknown }).privacyPolicyAccepted === true
  );
}

export function applyPrivacyPolicyAcceptance<T extends object>(
  user: T & {
    privacyPolicyAccepted?: boolean | null;
    privacyPolicyVersion?: string | null;
    privacyPolicyAcceptedAt?: Date | null;
  },
  currentVersion: string,
  acceptedAt = new Date(),
): Omit<T, 'privacyPolicyAccepted'> & {
  privacyPolicyVersion: string;
  privacyPolicyAcceptedAt: Date;
} {
  if (user.privacyPolicyAccepted !== true) {
    throw new PrivacyPolicyAcceptanceError();
  }

  const { privacyPolicyAccepted: _accepted, ...rest } = user;

  return {
    ...rest,
    privacyPolicyVersion: currentVersion,
    privacyPolicyAcceptedAt: acceptedAt,
  };
}
