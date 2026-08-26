import {
  applyPrivacyPolicyAcceptance,
  CURRENT_PRIVACY_POLICY_VERSION,
  PrivacyPolicyAcceptanceError,
} from './privacy-policy';

describe('applyPrivacyPolicyAcceptance', () => {
  const user = {
    id: 'user-1',
    email: 'volunteer@example.com',
    name: 'Volunteer',
  };

  it('stamps the current version and acceptedAt', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = applyPrivacyPolicyAcceptance(
      { ...user, privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION },
      now,
    );

    expect(result.privacyPolicyVersion).toBe('2026-08-25');
    expect(result.privacyPolicyAcceptedAt).toEqual(now);
  });

  it('overwrites a client-supplied acceptedAt', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = applyPrivacyPolicyAcceptance(
      {
        ...user,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        privacyPolicyAcceptedAt: new Date('2000-01-01T00:00:00.000Z'),
      },
      now,
    );

    expect(result.privacyPolicyAcceptedAt).toEqual(now);
  });

  it('rejects a missing version', () => {
    expect(() => applyPrivacyPolicyAcceptance(user)).toThrow(
      PrivacyPolicyAcceptanceError,
    );
  });

  it('rejects a stale version', () => {
    expect(() =>
      applyPrivacyPolicyAcceptance({
        ...user,
        privacyPolicyVersion: '1999-01-01',
      }),
    ).toThrow(PrivacyPolicyAcceptanceError);
  });
});
