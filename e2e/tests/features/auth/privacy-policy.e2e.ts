import { expect, test } from '@playwright/test';
import { API_URL, BASE_URL } from '../../../pages/AuthPage';
import { SignupPage } from '../../../pages/SignupPage';
import { TEST_PASSWORD, uniqueEmail } from '../../../utils/test-data';

const PRIVACY_PDF_PATH = '/legal/datenschutzhinweise-2026-08-25.pdf';
const CURRENT_VERSION = '2026-08-25';

const signupHeaders = {
  Origin: BASE_URL,
  Referer: `${BASE_URL}/en/signup`,
};

test.describe('Signup privacy policy', () => {
  test('privacy link opens the 2026-08-25 PDF in a new tab', async ({
    page,
    request,
  }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    await expect(signup.privacyLink).toHaveAttribute('href', PRIVACY_PDF_PATH);
    await expect(signup.privacyLink).toHaveAttribute('target', '_blank');

    const pdf = await request.get(`${BASE_URL}${PRIVACY_PDF_PATH}`);
    expect(pdf.ok()).toBe(true);
    expect(pdf.headers()['content-type'] ?? '').toMatch(/pdf/i);

    const popupPromise = page.waitForEvent('popup');
    await signup.privacyLink.click();
    await popupPromise;
    await expect(signup.privacyCheckbox).not.toBeChecked();
  });

  test('create-account stays disabled until the privacy checkbox is checked', async ({
    page,
  }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    await signup.fillForm({
      name: 'E2E User',
      email: uniqueEmail(),
      password: TEST_PASSWORD,
    });

    await expect(signup.privacyCheckbox).not.toBeChecked();
    await expect(signup.submitButton).toBeDisabled();

    await signup.acceptPrivacyPolicy();

    await expect(signup.privacyCheckbox).toBeChecked();
    await expect(signup.submitButton).toBeEnabled();
  });

  test('successful signup stores the current version and a server timestamp', async ({
    page,
  }) => {
    const signup = new SignupPage(page);
    await signup.goto();

    const response = await signup.signup(
      'E2E User',
      uniqueEmail(),
      TEST_PASSWORD,
    );
    expect(response.ok()).toBe(true);

    const requestBody = response.request().postDataJSON() as {
      privacyPolicyVersion?: string;
    };
    expect(requestBody.privacyPolicyVersion).toBe(CURRENT_VERSION);

    const payload = (await response.json()) as {
      user?: {
        privacyPolicyVersion?: string;
        privacyPolicyAcceptedAt?: string | Date | null;
      };
    };
    expect(payload.user?.privacyPolicyVersion).toBe(CURRENT_VERSION);
    expect(payload.user?.privacyPolicyAcceptedAt).toBeTruthy();
  });

  test('signup with a missing or stale version is rejected and creates no user', async ({
    request,
  }) => {
    const missingEmail = uniqueEmail();
    const staleEmail = uniqueEmail();

    const missing = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      headers: signupHeaders,
      data: {
        name: 'E2E User',
        email: missingEmail,
        password: TEST_PASSWORD,
      },
    });
    expect(missing.status()).toBe(400);

    const stale = await request.post(`${API_URL}/api/auth/sign-up/email`, {
      headers: signupHeaders,
      data: {
        name: 'E2E User',
        email: staleEmail,
        password: TEST_PASSWORD,
        privacyPolicyVersion: '1999-01-01',
      },
    });
    expect(stale.status()).toBe(400);

    for (const email of [missingEmail, staleEmail]) {
      const signIn = await request.post(`${API_URL}/api/auth/sign-in/email`, {
        headers: signupHeaders,
        data: { email, password: TEST_PASSWORD },
      });
      expect(signIn.ok()).toBe(false);
    }
  });
});
