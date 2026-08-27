import type { Page } from '@playwright/test';

// Override with E2E_BASE_URL; the Playwright config sets no baseURL.
export const BASE_URL =
  process.env.E2E_BASE_URL ?? 'https://staging.app.caluno.org';

// Override with E2E_API_URL. Staging web/api hosts differ by subdomain;
// local frontend (3000) talks to the local API (8080).
export const API_URL =
  process.env.E2E_API_URL ??
  (BASE_URL.includes('://staging.app.')
    ? BASE_URL.replace('://staging.app.', '://staging.api.')
    : 'http://localhost:8080');

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
