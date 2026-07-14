import type { Page } from '@playwright/test';

// Page object for /en/verify-email (OTP code entry).
export class VerifyEmailPage {
  constructor(private readonly page: Page) {}

  get otpInput() {
    return this.page.locator('#otp');
  }

  get verifyButton() {
    return this.page.getByRole('button', { name: 'Verify email' });
  }

  // Enters the code, submits, and waits until the app leaves verify-email.
  async verify(code: string) {
    await this.otpInput.fill(code);
    await this.verifyButton.click();
    // Verification + redirect to the heavy home page can be slow on staging;
    // resolve as soon as the URL leaves verify-email (commit), not full load.
    await this.page.waitForURL(
      (url) => !url.pathname.includes('/verify-email'),
      { timeout: 45_000, waitUntil: 'commit' },
    );
  }
}
