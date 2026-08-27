import { describe, expect, it } from 'bun:test';
import { API_URL } from '../constants';
import { buildSignupPayload, PRIVACY_POLICY_PDF_URL } from '../privacy-policy';

describe('privacy policy signup payload', () => {
  it('links the stable backend privacy policy PDF', () => {
    expect(PRIVACY_POLICY_PDF_URL).toBe(`${API_URL}/legal/privacy-policy.pdf`);
  });

  it('includes the accepted flag when the checkbox is accepted', () => {
    expect(
      buildSignupPayload({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret1',
        privacyAccepted: true,
      }),
    ).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'secret1',
      privacyPolicyAccepted: true,
    });
  });

  it('returns null when the checkbox is not accepted', () => {
    expect(
      buildSignupPayload({
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret1',
        privacyAccepted: false,
      }),
    ).toBeNull();
  });
});
