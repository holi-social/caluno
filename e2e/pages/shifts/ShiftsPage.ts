import { expect, type Page } from '@playwright/test';
import type { ShiftSpec } from '../../fixtures/shift-dataset';
import { BASE_URL } from '../AuthPage';

const SHIFTS_URL = /\/admin\/[0-9a-f-]{36}\/shifts/;
// After a successful create, the app opens the invite step: /shifts/<id>/invite.
const SHIFT_CREATED_URL = /\/shifts\/[0-9a-f-]{36}\/invite/;

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

  // --- create-shift form: structure locators (scoped to the sheet) ---
  get formDialog() {
    return this.page.getByRole('dialog');
  }

  get locationInput() {
    return this.page.locator('#location');
  }

  get instructionsInput() {
    return this.page.locator('#instructions');
  }

  get imageInput() {
    return this.formDialog.locator('input[type=file]');
  }

  get browseFilesButton() {
    return this.formDialog.getByRole('button', { name: 'Browse files' });
  }

  get recurrenceTrigger() {
    return this.formDialog.getByRole('combobox');
  }

  get openShiftSwitch() {
    return this.formDialog.getByRole('switch');
  }

  get cancelButton() {
    return this.formDialog.getByRole('button', { name: 'Cancel' });
  }

  get closeButton() {
    return this.formDialog.getByRole('button', { name: 'Close' });
  }

  // Weekday selector shown only when recurrence is "Custom recurrence".
  get weekdaySection() {
    return this.page.getByText('Choose which days this shift repeats');
  }

  // Opens the recurrence dropdown and selects an option.
  async selectRecurrence(option: string) {
    await this.recurrenceTrigger.click();
    await this.page.getByRole('option', { name: option }).click();
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
    // The form opens as a dialog. The first click may be dropped before
    // hydration, so retry until the shift-name field is visible.
    await expect(async () => {
      if (await this.shiftNameInput.isVisible()) return;
      await this.createShiftButton.click();
      await this.shiftNameInput.waitFor({ state: 'visible', timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
  }

  async save() {
    await this.saveShiftButton.click();
  }

  // Picks a deterministic future date (next month, the 15th).
  async pickDate() {
    await this.dateButton.click();
    await this.nextMonthButton.waitFor({ state: 'visible', timeout: 15000 });
    await this.nextMonthButton.click();
    await this.page.getByRole('button', { name: /15th/ }).click();
  }

  // Fills the required fields and submits. Date = next month's 15th.
  async createShift(name: string) {
    await this.shiftNameInput.fill(name);
    await this.pickDate();
    await this.timeInputs.nth(0).fill('09:00');
    await this.timeInputs.nth(1).fill('17:00');
    await this.save();
    await this.page.waitForURL(SHIFT_CREATED_URL, { timeout: 20000 });
  }

  private weekdayButton(day: string) {
    return this.formDialog.getByRole('button', { name: day, exact: true });
  }

  /**
   * Fills the create-shift form from a spec, submits, and returns the new
   * shift's id (parsed from the invite URL). Date = next month's 15th.
   */
  async createShiftFromSpec(spec: ShiftSpec): Promise<string> {
    await this.shiftNameInput.fill(spec.name);
    if (spec.location) await this.locationInput.fill(spec.location);
    if (spec.instructions) await this.instructionsInput.fill(spec.instructions);

    if (spec.recurrence !== 'Does not repeat') {
      await this.selectRecurrence(spec.recurrence);
    }
    if (spec.recurrence === 'Custom recurrence' && spec.weekdays) {
      for (const day of spec.weekdays) {
        await this.weekdayButton(day).click();
      }
    }
    if (!spec.openShift) {
      await this.openShiftSwitch.click(); // default is ON
    }

    await this.pickDate();
    await this.timeInputs.nth(0).fill(spec.startTime);
    await this.timeInputs.nth(1).fill(spec.endTime);

    await this.save();
    await this.page.waitForURL(SHIFT_CREATED_URL, { timeout: 20000 });
    const match = this.page.url().match(/\/shifts\/([0-9a-f-]{36})\/invite/);
    return match ? match[1] : '';
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.createShiftButton).toBeVisible();
  }

  async expectShiftCreated() {
    await expect(this.page).toHaveURL(SHIFT_CREATED_URL);
  }

  // Validation messages shown on submit (app-level, not native).
  get nameRequiredError() {
    return this.formDialog.getByText('Name is required');
  }

  get startTimeRequiredError() {
    return this.formDialog.getByText('Start time is required');
  }

  get endTimeRequiredError() {
    return this.formDialog.getByText('End time is required');
  }
}
