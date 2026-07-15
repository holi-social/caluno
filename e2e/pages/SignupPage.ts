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
}
