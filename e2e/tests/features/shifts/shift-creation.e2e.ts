import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { buildShiftDataset } from '../../../fixtures/shift-dataset';
import { OrgPage } from '../../../pages/org/OrgPage';
import { ShiftsPage } from '../../../pages/shifts/ShiftsPage';
import { signUpVerifyAndLogin } from '../../../utils/auth';

// Auth + one org per worker (storageState). Covers form structure, validation, and
// creating a shift dataset persisted to .auth/shifts-dataset.json for later reuse.

const authFile = '.auth/shifts-user.json';
const datasetFile = '.auth/shifts-dataset.json';
const runId = `${Date.now()}`;
const dataset = buildShiftDataset(runId);
let orgUId = '';

test.describe('Shift creation', () => {
  test.use({ storageState: authFile });

  let shifts: ShiftsPage;

  test.beforeAll(async ({ browser }) => {
    // Fresh, unauthenticated context (override the suite's storageState).
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await signUpVerifyAndLogin(page);
    const org = new OrgPage(page);
    await org.gotoCreate();
    orgUId = await org.createOrganization(`E2E Org ${Date.now()}`);
    await context.storageState({ path: authFile });
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    shifts = new ShiftsPage(page);
    await shifts.goto(orgUId);
    await shifts.expectLoaded();
    await shifts.openCreateForm();
  });

  test('shows all shift fields and controls', async () => {
    await expect(shifts.shiftNameInput).toBeVisible();
    await expect(shifts.dateButton).toBeVisible();
    await expect(shifts.timeInputs).toHaveCount(2);
    await expect(shifts.recurrenceTrigger).toBeVisible();
    await expect(shifts.locationInput).toBeVisible();
    await expect(shifts.instructionsInput).toBeVisible();
    await expect(shifts.browseFilesButton).toBeVisible();
    await expect(shifts.imageInput).toBeAttached();
    await expect(shifts.openShiftSwitch).toBeVisible();
    await expect(shifts.saveShiftButton).toBeVisible();
    await expect(shifts.cancelButton).toBeVisible();
    await expect(shifts.closeButton).toBeVisible();
  });

  test('marks shift name and date/time as required', async ({ page }) => {
    await expect(page.getByText('Shift name *')).toBeVisible();
    await expect(page.getByText('Date and time *')).toBeVisible();
  });

  test('has the expected default values', async () => {
    await expect(shifts.recurrenceTrigger).toContainText('Does not repeat');
    await expect(shifts.openShiftSwitch).toBeChecked();
    await expect(shifts.shiftNameInput).toHaveValue('');
    await expect(shifts.locationInput).toHaveValue('');
    await expect(shifts.instructionsInput).toHaveValue('');
  });

  test('disables the time inputs until a date is selected', async () => {
    await expect(shifts.timeInputs.nth(0)).toBeDisabled();
    await expect(shifts.timeInputs.nth(1)).toBeDisabled();
  });

  test('recurrence dropdown lists the expected options', async ({ page }) => {
    await shifts.recurrenceTrigger.click();

    for (const option of [
      'Does not repeat',
      'Every day',
      'Every working day',
      'Every weekend day',
      'Custom recurrence',
    ]) {
      await expect(page.getByRole('option', { name: option })).toBeVisible();
    }
  });

  test('custom recurrence reveals the weekday selector', async () => {
    await expect(shifts.weekdaySection).toBeHidden();
    await shifts.selectRecurrence('Custom recurrence');
    await expect(shifts.weekdaySection).toBeVisible();
  });

  test.describe('required field validation', () => {
    test('shows validation errors when submitting an empty form', async ({
      page,
    }) => {
      await shifts.save();

      await expect(shifts.nameRequiredError).toBeVisible();
      await expect(shifts.startTimeRequiredError).toBeVisible();
      await expect(shifts.endTimeRequiredError).toBeVisible();
      await expect(page).toHaveURL(/\/shifts\/new/); // no shift created
    });

    test('requires start and end time even when a name is provided', async () => {
      await shifts.shiftNameInput.fill('E2E Shift');
      await shifts.save();

      await expect(shifts.nameRequiredError).toBeHidden();
      await expect(shifts.startTimeRequiredError).toBeVisible();
      await expect(shifts.endTimeRequiredError).toBeVisible();
    });
  });

  test.describe('validation recovery', () => {
    test('clears the name error after a name is entered', async () => {
      await shifts.save();
      await expect(shifts.nameRequiredError).toBeVisible();

      await shifts.shiftNameInput.fill('E2E Shift');
      await expect(shifts.nameRequiredError).toBeHidden();
    });
  });

  test.describe('date and time dependency', () => {
    test('enables the time inputs after a date is selected', async () => {
      await expect(shifts.timeInputs.nth(0)).toBeDisabled();

      await shifts.pickDate();

      await expect(shifts.timeInputs.nth(0)).toBeEnabled();
      await expect(shifts.timeInputs.nth(1)).toBeEnabled();
    });
  });

  // Create the shift dataset and persist it (with ids) for the All Shifts suite.
  test.describe('successful creation', () => {
    const created: Array<ShiftSpecWithId> = [];

    for (const spec of dataset) {
      test(`creates shift — Open ${spec.openShift ? 'ON' : 'OFF'} ${spec.startTime}-${spec.endTime}`, async () => {
        const id = await shifts.createShiftFromSpec(spec);

        await shifts.expectShiftCreated();
        expect(id, 'created shift should have an id').not.toBe('');
        created.push({ ...spec, id });
      });
    }

    test.afterAll(() => {
      mkdirSync('.auth', { recursive: true });
      writeFileSync(
        datasetFile,
        JSON.stringify({ orgUId, shifts: created }, null, 2),
      );
    });
  });
});

type ShiftSpecWithId = (typeof dataset)[number] & { id: string };
