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
    await expect(
      this.page.getByRole('heading', { name: 'Home' }),
    ).toBeVisible();
  }
}
