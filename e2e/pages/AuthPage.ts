import type { Page } from '@playwright/test';

// Override with E2E_BASE_URL; the Playwright config sets no baseURL.
export const BASE_URL =
  process.env.E2E_BASE_URL ?? 'https://staging.app.caluno.org';

// Shared base for the login/signup page objects.
export abstract class AuthPage {
  protected readonly locale = 'en';

  constructor(protected readonly page: Page) {}

  protected url(path: string): string {
    return `${BASE_URL}/${this.locale}${path}`;
  }

  get emailInput() {
    return this.page.getByLabel('Email');
  }

  get passwordInput() {
    return this.page.getByLabel('Password');
  }
}
