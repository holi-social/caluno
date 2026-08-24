import { describe, expect, it } from 'bun:test';
import {
  buildSignupPayload,
  PRIVACY_POLICY_PDF_PATH,
  PRIVACY_POLICY_VERSION,
} from '../privacy-policy';

describe('privacy policy signup payload', () => {
  it('uses the 2026-08-17 document version in the public PDF path', () => {
    expect(PRIVACY_POLICY_VERSION).toBe('2026-08-17');
    expect(PRIVACY_POLICY_PDF_PATH).toBe(
      '/legal/datenschutzhinweise-2026-08-17.pdf',
    );
  });

  it('includes the current version when the checkbox is accepted', () => {
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
      privacyPolicyVersion: '2026-08-17',
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
