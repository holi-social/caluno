import { expect, type Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

const ORG_DASHBOARD = /\/admin\/[0-9a-f-]{36}/;

export class OrgPage {
  constructor(private readonly page: Page) {}

  get getStartedButton() {
    return this.page.getByRole('button', { name: 'Get started' });
  }

  get nameInput() {
    return this.page.locator('#name');
  }

  get descriptionInput() {
    return this.page.locator('#description');
  }

  get createButton() {
    return this.page.getByRole('button', { name: 'Create organization' });
  }

  // Onboarding entry for org-less accounts.
  async gotoOnboarding() {
    await this.page.goto(`${BASE_URL}/en/admin`, { waitUntil: 'load' });
  }

  async gotoCreate() {
    await this.page.goto(`${BASE_URL}/en/admin/create-organization`, {
      waitUntil: 'load',
    });
  }

  // The "Get started" click can be dropped before hydration, so retry it.
  async startCreation() {
    await expect(this.getStartedButton).toBeVisible();
    await expect(async () => {
      if (/\/admin\/create-organization/.test(this.page.url())) return;
      await this.getStartedButton.click();
      await this.page.waitForURL(/\/admin\/create-organization/, {
        timeout: 4000,
      });
    }).toPass({ timeout: 20000 });
  }

  // Creates an org and returns its UID from the dashboard URL.
  async createOrganization(name: string): Promise<string> {
    await expect(this.nameInput).toBeVisible();
    await this.nameInput.fill(name);
    await this.createButton.click();
    await this.page.waitForURL(ORG_DASHBOARD, { timeout: 20000 });
    const match = this.page.url().match(/\/admin\/([0-9a-f-]{36})/);
    if (!match)
      throw new Error(`Org dashboard URL not matched: ${this.page.url()}`);
    return match[1];
  }

  async expectDashboard(name: string) {
    await expect(this.page).toHaveURL(ORG_DASHBOARD);
    await expect(this.page.getByRole('heading', { name })).toBeVisible();
  }
}
