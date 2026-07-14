import { expect, type Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

const SHIFTS_URL = /\/admin\/[0-9a-f-]{36}\/shifts/;
// After create, the app opens the invite step with the new shift id.
const SHIFT_CREATED_URL = /\/shifts\?.*sheet=invite-shift.*id=/;

export class ShiftsPage {
  constructor(private readonly page: Page) {}

  get heading() {
    return this.page.getByRole('heading', { name: 'Shifts', exact: true });
  }

  get createShiftButton() {
    return this.page.getByRole('button', { name: 'Create shift' }).first();
  }

  get sidebarLink() {
    return this.page.getByRole('link', { name: 'Shifts' }).first();
  }

  // Create-shift form.
  get shiftNameInput() {
    return this.page.locator('#name');
  }

  get dateButton() {
    return this.page.getByRole('button', { name: 'Date' });
  }

  get nextMonthButton() {
    return this.page.getByRole('button', { name: 'Go to the Next Month' });
  }

  get timeInputs() {
    return this.page.locator('input[type=time]');
  }

  get saveShiftButton() {
    return this.page.getByRole('button', { name: 'Save changes' });
  }

  get createdToast() {
    return this.page.getByText('Shift created');
  }

  async goto(orgUId: string) {
    // Heavy admin page — `load` is unreliably slow on staging; rely on the
    // visibility waits in expectLoaded() for readiness instead.
    await this.page.goto(`${BASE_URL}/en/admin/${orgUId}/shifts`, {
      waitUntil: 'domcontentloaded',
    });
  }

  async openFromSidebar() {
    await this.sidebarLink.click();
    await this.page.waitForURL(SHIFTS_URL, { timeout: 15000 });
  }

  async openCreateForm() {
    // After a DCL navigation the page can be briefly un-hydrated, so the first
    // click may be dropped — retry idempotently until the sheet opens.
    await expect(async () => {
      if (/sheet=shift-form/.test(this.page.url())) return;
      await this.createShiftButton.click();
      await this.page.waitForURL(/sheet=shift-form/, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await this.shiftNameInput.waitFor({ state: 'visible', timeout: 20_000 });
  }

  // Fills the required fields and submits. Date = next month's 15th (a future,
  // unambiguous calendar match).
  async createShift(name: string) {
    await this.shiftNameInput.fill(name);

    await this.dateButton.click();
    await this.nextMonthButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.nextMonthButton.click();
    await this.page.getByRole('button', { name: /15th/ }).click();

    await this.timeInputs.nth(0).fill('09:00');
    await this.timeInputs.nth(1).fill('17:00');

    await this.saveShiftButton.click();
    await this.page.waitForURL(SHIFT_CREATED_URL, { timeout: 20000 });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.createShiftButton).toBeVisible();
  }

  async expectShiftCreated() {
    await expect(this.page).toHaveURL(SHIFT_CREATED_URL);
  }
}
