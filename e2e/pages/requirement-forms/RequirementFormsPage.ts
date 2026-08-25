import { expect, type Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

const FORMS_URL = /\/admin\/[0-9a-f-]{36}\/requirement-forms$/;
const BUILDER_URL = /\/requirement-forms\/[0-9a-f-]{36}\/builder/;

export class RequirementFormsPage {
  constructor(private readonly page: Page) {}

  get createFormButton() {
    return this.page.getByRole('button', { name: 'Create Form' });
  }

  get formNameInput() {
    return this.page.locator('#name');
  }

  get createSubmit() {
    return this.page.getByRole('button', { name: 'Create', exact: true });
  }

  async goto(orgUId: string) {
    await this.page.goto(`${BASE_URL}/en/admin/${orgUId}/requirement-forms`, {
      waitUntil: 'domcontentloaded',
    });
  }

  // Opens the create dialog, submits, and lands on the new form's builder.
  async createForm(name: string): Promise<string> {
    await this.createFormButton.click();
    await this.formNameInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.formNameInput.fill(name);
    await this.createSubmit.click();
    await this.page.waitForURL(BUILDER_URL, { timeout: 20000 });
    const match = this.page
      .url()
      .match(/\/requirement-forms\/([0-9a-f-]{36})\/builder/);
    if (!match) throw new Error(`Builder URL not matched: ${this.page.url()}`);
    return match[1];
  }

  async expectOnList() {
    await expect(this.page).toHaveURL(FORMS_URL);
  }
}
