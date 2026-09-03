import { expect, type Page } from '@playwright/test';
import type { Shift } from '../../fixtures/shift';
import { BASE_URL } from '../AuthPage';

const SHIFTS_URL = /\/admin\/[0-9a-f-]{36}\/shifts/;

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

  get shiftCreatedConfirmation() {
    return this.page.getByText('Shift created');
  }

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

  // Shown only for "Custom recurrence".
  get weekdaySection() {
    return this.page.getByText('Choose which days this shift repeats');
  }

  async selectRecurrence(option: string) {
    await this.recurrenceTrigger.click();
    await this.page.getByRole('option', { name: option }).click();
  }

  async goto(orgUId: string) {
    // `load` is unreliably slow on staging; wait on readiness signals instead.
    await this.page.goto(`${BASE_URL}/en/admin/${orgUId}/shifts`, {
      waitUntil: 'domcontentloaded',
    });
    await this.heading.waitFor();
    await this.createShiftButton.waitFor();
  }

  async openFromSidebar() {
    await this.sidebarLink.click();
    await this.page.waitForURL(SHIFTS_URL);
  }

  async openCreateForm() {
    // First click may be dropped before hydration; retry until the form opens.
    await expect(async () => {
      if (await this.shiftNameInput.isVisible()) return;
      await this.createShiftButton.click();
      await this.shiftNameInput.waitFor({ state: 'visible', timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
  }

  async save() {
    await this.saveShiftButton.click();
  }

  // Next month's 15th — a deterministic future date.
  async pickDate() {
    await this.dateButton.click();
    await this.nextMonthButton.waitFor();
    await this.nextMonthButton.click();
    await this.page.getByRole('button', { name: /15th/ }).click();
  }

  private weekdayButton(day: string) {
    return this.formDialog.getByRole('button', { name: day, exact: true });
  }

  // Fills and submits the form, returning the new shift's id.
  async createShift(shift: Shift): Promise<string> {
    await this.shiftNameInput.fill(shift.name);
    if (shift.location) await this.locationInput.fill(shift.location);
    if (shift.instructions) {
      await this.instructionsInput.fill(shift.instructions);
    }

    if (shift.recurrence !== 'Does not repeat') {
      await this.selectRecurrence(shift.recurrence);
    }
    if (shift.recurrence === 'Custom recurrence' && shift.weekdays) {
      for (const day of shift.weekdays) {
        await this.weekdayButton(day).click();
      }
    }
    if (!shift.openShift) {
      await this.openShiftSwitch.click(); // default is ON
    }

    await this.pickDate();
    await this.timeInputs.nth(0).fill(shift.startTime);
    await this.timeInputs.nth(1).fill(shift.endTime);

    await this.save();
    // Open shifts land on a "Shift created" confirmation; invite-only shifts
    // route to /shifts/<id>/invite.
    if (shift.openShift) {
      await this.awaitShiftCreated();
      return this.createdShiftId();
    }
    const inviteUrl = /\/shifts\/([0-9a-f-]{36})\/invite/;
    await this.page.waitForURL(inviteUrl, { waitUntil: 'commit' });
    return this.page.url().match(inviteUrl)?.[1] ?? '';
  }

  // Confirmation can take ~30s (the server notifies volunteers first).
  private async awaitShiftCreated() {
    await this.shiftCreatedConfirmation.waitFor({ timeout: 60_000 });
  }

  // Reads the shift id from the confirmation's shareable link.
  private async createdShiftId(): Promise<string> {
    const link = this.formDialog.getByText(/\/shifts\/[0-9a-f-]{36}/).first();
    const text = (await link.textContent()) ?? '';
    return text.match(/\/shifts\/([0-9a-f-]{36})/)?.[1] ?? '';
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.createShiftButton).toBeVisible();
  }

  async expectShiftCreated() {
    await expect(this.shiftCreatedConfirmation).toBeVisible();
  }

  // One-time shifts show the "One-time" tag and date; recurring shifts list
  // their weekdays.
  async expectCreatedShift(shift: Shift) {
    if (shift.recurrence === 'Does not repeat') {
      await expect(this.formDialog.getByText('One-time')).toBeVisible();
      await expect(this.formDialog).toContainText(this.expectedShiftDate());
    } else {
      await expect(this.formDialog).toContainText('future instances');
      for (const day of shift.weekdays ?? []) {
        await expect(this.formDialog).toContainText(day);
      }
    }
  }

  // pickDate's date (next month's 15th), formatted as the UI shows it (DD/MM/YYYY).
  private expectedShiftDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 15);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${date.getFullYear()}`;
  }

  // App-level validation messages (not native).
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
