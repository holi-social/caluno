import {
  applyPrivacyPolicyAcceptance,
  PrivacyPolicyAcceptanceError,
  privacyPolicyAcceptedFromBody,
} from './privacy-policy';

describe('privacyPolicyAcceptedFromBody', () => {
  it('is true only when the request body flag is true', () => {
    expect(privacyPolicyAcceptedFromBody({ privacyPolicyAccepted: true })).toBe(
      true,
    );
    expect(
      privacyPolicyAcceptedFromBody({ privacyPolicyAccepted: false }),
    ).toBe(false);
    expect(privacyPolicyAcceptedFromBody({ name: 'Volunteer' })).toBe(false);
    expect(privacyPolicyAcceptedFromBody(undefined)).toBe(false);
  });
});

describe('applyPrivacyPolicyAcceptance', () => {
  const user = {
    id: 'user-1',
    email: 'volunteer@example.com',
    name: 'Volunteer',
  };
  const currentVersion = '2026-08-25';

  it('stamps the current version and acceptedAt', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = applyPrivacyPolicyAcceptance(
      { ...user, privacyPolicyAccepted: true },
      currentVersion,
      now,
    );

    expect(result.privacyPolicyVersion).toBe(currentVersion);
    expect(result.privacyPolicyAcceptedAt).toEqual(now);
    expect(result).not.toHaveProperty('privacyPolicyAccepted');
  });

  it('overwrites a client-supplied version and acceptedAt', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = applyPrivacyPolicyAcceptance(
      {
        ...user,
        privacyPolicyAccepted: true,
        privacyPolicyVersion: '1999-01-01',
        privacyPolicyAcceptedAt: new Date('2000-01-01T00:00:00.000Z'),
      },
      currentVersion,
      now,
    );

    expect(result.privacyPolicyVersion).toBe(currentVersion);
    expect(result.privacyPolicyAcceptedAt).toEqual(now);
  });

  it('rejects a missing acceptance flag', () => {
    expect(() => applyPrivacyPolicyAcceptance(user, currentVersion)).toThrow(
      PrivacyPolicyAcceptanceError,
    );
  });

  it('rejects a false acceptance flag', () => {
    expect(() =>
      applyPrivacyPolicyAcceptance(
        { ...user, privacyPolicyAccepted: false },
        currentVersion,
      ),
    ).toThrow(PrivacyPolicyAcceptanceError);
  });
});
