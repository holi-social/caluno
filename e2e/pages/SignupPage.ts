import { expect, type Response } from '@playwright/test';
import { AuthPage } from './AuthPage';

export class SignupPage extends AuthPage {
  get nameInput() {
    return this.page.getByLabel('Full Name');
  }

  get submitButton() {
    return this.page.getByRole('button', { name: 'Create account' });
  }

  get loginLink() {
    return this.page.getByRole('link', { name: 'Sign in' });
  }

  // Privacy-policy consent checkbox that gates submit.
  get consentCheckbox() {
    return this.page.getByRole('checkbox').first();
  }

  async goto() {
    await this.page.goto(this.url('/signup'), { waitUntil: 'load' });
  }

  async signup(
    name: string,
    email: string,
    password: string,
  ): Promise<Response> {
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.consentCheckbox.check();
    const [res] = await Promise.all([
      this.page.waitForResponse(
        (r) => r.url().includes('/api/auth/sign-up/email'),
        { timeout: 15000 },
      ),
      this.submitButton.click(),
    ]);
    return res;
  }

  // Signup routes to the email-verification page.
  async expectVerificationPrompt() {
    await expect(this.page).toHaveURL(/\/en\/verify-email/);
    await expect(
      this.page.getByRole('heading', { name: 'Verify your email' }),
    ).toBeVisible();
  }

  // Server-side errors (invalid email, rate limit, ...) surface as a toast.
  get errorToast() {
    return this.page.locator('[data-sonner-toast]');
  }

  async submit() {
    await this.submitButton.click();
  }

  // Fills only the provided fields; leaves the rest untouched.
  async fillForm(values: { name?: string; email?: string; password?: string }) {
    if (values.name !== undefined) await this.nameInput.fill(values.name);
    if (values.email !== undefined) await this.emailInput.fill(values.email);
    if (values.password !== undefined) {
      await this.passwordInput.fill(values.password);
    }
  }

  private fieldLocator(field: 'name' | 'email' | 'password') {
    if (field === 'name') return this.nameInput;
    if (field === 'email') return this.emailInput;
    return this.passwordInput;
  }

  // Native HTML5 constraint-validation state for a field.
  fieldValidity(field: 'name' | 'email' | 'password') {
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
