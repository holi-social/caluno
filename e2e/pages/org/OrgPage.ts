import { expect, type Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

const ORG_DASHBOARD = /\/admin\/[0-9a-f-]{36}/;

export class OrgPage {
  constructor(private readonly page: Page) {}

  get getStartedButton() {
    return this.page.getByRole('button', { name: 'Get started' });
  }

  get nameInput() {
    return this.page.getByLabel('Organization name');
  }

  get descriptionInput() {
    return this.page.getByLabel('Description');
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
    await this.page.waitForURL(ORG_DASHBOARD);
    const match = this.page.url().match(/\/admin\/([0-9a-f-]{36})/);
    if (!match)
      throw new Error(`Org dashboard URL not matched: ${this.page.url()}`);
    return match[1];
  }

  async expectDashboard(name: string) {
    await expect(this.page).toHaveURL(ORG_DASHBOARD);
    await expect(this.page.getByRole('heading', { name })).toBeVisible();
  }

  get contactEmailInput() {
    return this.page.getByLabel('Email', { exact: true });
  }

  get phoneInput() {
    return this.page.getByLabel('Phone');
  }

  get websiteUrlInput() {
    return this.page.getByLabel('Website');
  }

  get addressInput() {
    return this.page.getByLabel('Address');
  }

  async submit() {
    await this.createButton.click();
  }

  // Fills only the provided fields; leaves the rest untouched.
  async fillForm(values: {
    name?: string;
    description?: string;
    contactEmail?: string;
    phone?: string;
    websiteUrl?: string;
    address?: string;
  }) {
    if (values.name !== undefined) await this.nameInput.fill(values.name);
    if (values.description !== undefined) {
      await this.descriptionInput.fill(values.description);
    }
    if (values.contactEmail !== undefined) {
      await this.contactEmailInput.fill(values.contactEmail);
    }
    if (values.phone !== undefined) await this.phoneInput.fill(values.phone);
    if (values.websiteUrl !== undefined) {
      await this.websiteUrlInput.fill(values.websiteUrl);
    }
    if (values.address !== undefined) {
      await this.addressInput.fill(values.address);
    }
  }

  private fieldLocator(
    field: 'name' | 'contactEmail' | 'phone' | 'websiteUrl',
  ) {
    switch (field) {
      case 'contactEmail':
        return this.contactEmailInput;
      case 'phone':
        return this.phoneInput;
      case 'websiteUrl':
        return this.websiteUrlInput;
      default:
        return this.nameInput;
    }
  }

  // Native HTML5 constraint-validation state for a field.
  fieldValidity(field: 'name' | 'contactEmail' | 'phone' | 'websiteUrl') {
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

  get logoInput() {
    return this.page.locator('input[type=file]');
  }

  get browseFilesButton() {
    return this.page.getByRole('button', { name: 'Browse files' });
  }

  // Shown when a non-image file is selected for the logo.
  get logoTypeError() {
    return this.page.getByText(/This file type is not allowed/i);
  }

  async uploadLogo(file: { name: string; mimeType: string; buffer: Buffer }) {
    await this.logoInput.setInputFiles(file);
  }
}
