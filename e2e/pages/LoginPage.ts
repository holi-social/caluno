import { expect, type Response } from '@playwright/test';
import { AuthPage } from './AuthPage';

export class LoginPage extends AuthPage {
  get submitButton() {
    return this.page.getByRole('button', { name: 'Sign in' });
  }

  get signupLink() {
    return this.page.getByRole('link', { name: 'Sign up' });
  }

  get forgotPasswordLink() {
    return this.page.getByRole('link', { name: 'Forgot password?' });
  }

  async goto() {
    await this.page.goto(this.url('/login'), { waitUntil: 'load' });
  }

  async login(email: string, password: string): Promise<Response> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    const [res] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/auth/sign-in/email'),
        { timeout: 15000 },
      ),
      this.submitButton.click(),
    ]);
    return res;
  }

  async expectLoggedIn() {
    await expect(this.page).toHaveURL(/\/en\/?$/);
    // Authenticated home greets the user by name (user-agnostic logged-in signal).
    await expect(
      this.page.getByRole('heading', { name: /^Hi\b/ }),
    ).toBeVisible();
  }

  // Server-side errors (bad credentials, rate limit, ...) surface as a toast.
  get errorToast() {
    return this.page.locator('[data-sonner-toast]');
  }

  async submit() {
    await this.submitButton.click();
  }

  // Fills only the provided fields; leaves the rest untouched.
  async fillForm(values: { email?: string; password?: string }) {
    if (values.email !== undefined) await this.emailInput.fill(values.email);
    if (values.password !== undefined) {
      await this.passwordInput.fill(values.password);
    }
  }

  private fieldLocator(field: 'email' | 'password') {
    return field === 'email' ? this.emailInput : this.passwordInput;
  }

  // Native HTML5 constraint-validation state for a field.
  fieldValidity(field: 'email' | 'password') {
    return this.fieldLocator(field).evaluate((el) => {
      const input = el as HTMLInputElement;
      return {
        valid: input.validity.valid,
        valueMissing: input.validity.valueMissing,
        typeMismatch: input.validity.typeMismatch,
        tooShort: input.validity.tooShort,
      };
    });
  }
}
