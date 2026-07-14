import { expect, test } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';

/**
 * Login validation suite — strictly frontend-only.
 *
 * The login form validates via native HTML5 constraints (email required +
 * type=email, password required + minLength=6). No account is signed in here:
 * native validation blocks submission, so no sign-in request is sent — asserted
 * via a passive request listener (not interception). A successful login belongs
 * to the smoke suite only.
 */

const VALID_EMAIL = 'user@example.com';
const VALID_PASSWORD = 'Test1234!aB';

test.describe('Login validation', () => {
  let login: LoginPage;
  let loginRequested: boolean;

  test.beforeEach(async ({ page }) => {
    loginRequested = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/sign-in/')) loginRequested = true;
    });

    login = new LoginPage(page);
    await login.goto();
  });

  test.afterEach(() => {
    expect(
      loginRequested,
      'validation tests must not send a login request',
    ).toBe(false);
  });

  test.describe('required fields', () => {
    test('email is required', async ({ page }) => {
      await login.fillForm({ password: VALID_PASSWORD });
      await login.submit();

      expect(await login.fieldValidity('email')).toMatchObject({
        valid: false,
        valueMissing: true,
      });
      await expect(page).toHaveURL(/\/login/);
    });

    test('password is required', async ({ page }) => {
      await login.fillForm({ email: VALID_EMAIL });
      await login.submit();

      expect(await login.fieldValidity('password')).toMatchObject({
        valid: false,
        valueMissing: true,
      });
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('email format', () => {
    for (const email of ['notanemail', 'test@', 'test@a.']) {
      test(`rejects malformed email "${email}"`, async ({ page }) => {
        await login.fillForm({ email, password: VALID_PASSWORD });
        await login.submit();

        expect(await login.fieldValidity('email')).toMatchObject({
          valid: false,
          typeMismatch: true,
        });
        await expect(page).toHaveURL(/\/login/);
      });
    }
  });

  test.describe('password length', () => {
    test('rejects password shorter than 6', async ({ page }) => {
      await login.fillForm({ email: VALID_EMAIL, password: '12345' });
      await login.submit();

      expect(await login.fieldValidity('password')).toMatchObject({
        valid: false,
      });
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
