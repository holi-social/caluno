import { expect, type Page } from '@playwright/test';

export class FormBuilderPage {
  constructor(private readonly page: Page) {}

  get emptyStateHeading() {
    return this.page.getByRole('heading', { name: 'You have no blocks yet' });
  }

  get addBlockButton() {
    return this.page.getByRole('button', { name: 'Add Block' }).first();
  }

  get saveFormButton() {
    return this.page.getByRole('button', { name: 'Save Form' });
  }

  get cancelButton() {
    return this.page.getByRole('button', { name: 'Cancel' });
  }

  get copyShareLinkButton() {
    return this.page.getByRole('button', { name: 'Copy Share Link' });
  }

  get createNewBlockButton() {
    return this.page.getByRole('button', { name: 'Create new block' });
  }

  get blockTitleInput() {
    return this.page.getByPlaceholder('e.g. Personal Information');
  }

  get createBlockSubmit() {
    return this.page.getByRole('button', { name: 'Create Block' });
  }

  get savedToast() {
    return this.page.getByText('Form saved');
  }

  blockHeading(title: string) {
    return this.page.getByRole('heading', { name: title, level: 3 }).first();
  }

  previewBlockHeading(title: string) {
    return this.page.getByRole('heading', { name: title, level: 4 });
  }

  async expectEmptyState() {
    await expect(this.emptyStateHeading).toBeVisible({ timeout: 20000 });
    await expect(this.addBlockButton).toBeVisible();
    await expect(this.saveFormButton).toBeDisabled();
    await expect(this.copyShareLinkButton).toBeVisible();
  }

  async openAddBlockDialog() {
    await this.addBlockButton.click();
    await expect(this.createNewBlockButton).toBeVisible({ timeout: 20000 });
  }

  async createBlockViaSheet(title: string) {
    await expect(async () => {
      if (/sheet=block-form/.test(this.page.url())) return;
      await this.createNewBlockButton.click();
      await this.page.waitForURL(/sheet=block-form/, { timeout: 5000 });
    }).toPass({ timeout: 30000 });
    await this.blockTitleInput.waitFor({ state: 'visible', timeout: 20000 });
    await this.blockTitleInput.fill(title);
    await this.createBlockSubmit.click();

    await expect(this.blockHeading(title)).toBeVisible({ timeout: 30000 });
  }

  async saveForm() {
    await expect(this.saveFormButton).toBeEnabled();
    await this.saveFormButton.click();
    await expect(this.savedToast).toBeVisible({ timeout: 20000 });
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
