import type { Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

/**
 * The volunteer's profile — its "Your organizations" cards link into each
 * membership page, which holds "Your documents".
 */
export class VolunteerProfilePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto(`${BASE_URL}/en/profile`, { waitUntil: 'load' });
  }

  /**
   * Opens the first membership ("Open" card link) and returns its absolute
   * URL so the caller can navigate straight to it.
   */
  async openMembership(): Promise<string> {
    const link = this.page.getByRole('link', { name: 'Open' }).first();
    const href = await link.getAttribute('href');
    if (!href) throw new Error('Membership card has no link');
    await link.click();
    await this.page.waitForURL(/\/en\/profile\/memberships\//, {
      timeout: 15_000,
    });
    return `${BASE_URL}${href}`;
  }
}
