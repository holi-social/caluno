import { expect, type Locator, type Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

/**
 * The admin reimbursements board (`/admin/[orgUId]/accounting/reimbursements`)
 * — creating documents through the two-step modal, and countersigning /
 * inspecting them from the board. Relies on the local dev playground
 * fixtures (my-shifts.e2e.ts precedent).
 *
 * Board row statuses: only the placeholder/terminal states render a label
 * on the row ("Not yet created", "No contract — create manually",
 * "Declined"). Signing-state rows are dimmed and show no status text — the
 * coordinator's turn (awaiting their countersignature) is the row that
 * gains the "Countersign" action button. The board also does not reflect a
 * just-created document without a reload, so helpers reload after actions.
 */
export class AdminReimbursementsPage {
  constructor(private readonly page: Page) {}

  async goto(orgUnitId: string) {
    await this.page.goto(
      `${BASE_URL}/en/admin/${orgUnitId}/accounting/reimbursements`,
      { waitUntil: 'load' },
    );
  }

  get createDocumentButton() {
    return this.page.getByRole('button', { name: 'Create document' });
  }

  /** A real contract row: period + doc name, no placeholder/status suffix. */
  contractRow(): Locator {
    return this.page.getByRole('row', {
      name: '2026 Contract Ehrenamtspauschale',
      exact: true,
    });
  }

  /** The row whose turn it is for the coordinator — the one with the action. */
  countersignRow(): Locator {
    return this.page
      .getByRole('row', { name: /Contract Ehrenamtspauschale/ })
      .filter({ has: this.page.getByRole('button', { name: 'Countersign' }) });
  }

  /** A declined contract row (shows the "Declined" label). */
  declinedRow(): Locator {
    return this.page
      .getByRole('row', { name: /Contract Ehrenamtspauschale/ })
      .filter({ hasText: 'Declined' });
  }

  /** The open document detail sheet. */
  documentSheet(): Locator {
    return this.page.getByRole('dialog');
  }

  /**
   * Opens the detail sheet of the first real contract row whose PDF is
   * downloadable. Leftover documents from earlier runs can predate PDF
   * rendering (no downloadUrl → disabled Download), so this skips rows whose
   * sheet has a disabled Download button instead of assuming the first row.
   */
  async openFirstContractSheet() {
    const rows = this.contractRow();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await rows.nth(i).click();
      const sheet = this.page.getByRole('dialog');
      await expect(sheet).toBeVisible();
      const download = sheet.getByRole('button', { name: 'Download' });
      // The detail sheet resolves fast; a disabled button after load means
      // this row predates PDF rendering — move on quickly.
      try {
        await expect(download).toBeEnabled({ timeout: 2_000 });
        return;
      } catch {
        await this.page.keyboard.press('Escape');
        await expect(sheet).toBeHidden({ timeout: 5_000 });
      }
    }
    throw new Error('No contract row has an enabled Download button');
  }

  /**
   * Full create flow: volunteer (search combobox) → contract line → review &
   * send. The volunteer's name is asserted in the combobox, which is the
   * regression guard for the "uuid shown instead of name" bug.
   */
  async createContractFor(volunteerName: string) {
    await this.createDocumentButton.click();

    const volunteerInput = this.page.getByPlaceholder('Search for a volunteer');
    await volunteerInput.click();
    await volunteerInput.fill(volunteerName);
    // The picker annotates the option with the volunteer's per-Pauschale
    // document state, so anchor on the name prefix instead of matching exactly.
    const option = this.page.getByRole('option', {
      name: new RegExp(
        `^${volunteerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      ),
    });
    await option.click();
    // The input must show the volunteer's name, not their id.
    await expect(volunteerInput).toHaveValue(volunteerName);

    // The line button's accessible name also carries the status label text
    // ("Create contract · …"), so anchor on the document name prefix.
    await this.page
      .getByRole('button', { name: /^Contract Ehrenamtspauschale/ })
      .click();
    await this.page.getByRole('button', { name: /^Create Contract$/ }).click();

    const send = this.page.getByRole('button', {
      name: 'Save and send for signing',
    });
    await expect(send).toBeEnabled();
    await send.click();

    // The creation modal closes only after the contract is sent. Assert that
    // state rather than the success toast, which a duplicated `sonner`
    // instance in the local dev bundle swallows (toasts render on staging).
    await expect(send).toBeHidden({ timeout: 20_000 });

    // The board picks it up as a document row (awaiting the volunteer's
    // signature) — reload because the board doesn't reflect a just-created
    // document without one.
    await this.page.reload({ waitUntil: 'load' });
    await expect(this.contractRow().first()).toBeVisible();
  }

  /**
   * Countersigns one document now waiting on the coordinator. Robust to
   * leftover coord docs from earlier runs: asserts the coord row count
   * decreases by exactly one rather than reaching zero.
   */
  async countersignContract(volunteerName: string) {
    await this.page.reload({ waitUntil: 'load' });
    const rows = this.countersignRow();
    // The board is a client component; wait for it to render the coord row
    // before counting (a bare count after reload can read 0 too early).
    await expect(rows.first()).toBeVisible();
    const before = await rows.count();

    // The row action opens the document detail sheet; countersign from there.
    await rows.first().getByRole('button', { name: 'Countersign' }).click();
    const sheet = this.documentSheet();
    await expect(sheet).toBeVisible();
    const countersign = sheet.getByRole('button', { name: 'Countersign' });
    await expect(countersign).toBeEnabled();

    // Wait on the mutation response rather than the success toast, which a
    // duplicated `sonner` instance in the local dev bundle swallows.
    const [signResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes('/graphql') &&
          (response.request().postData() ?? '').includes('SignContract'),
        { timeout: 20_000 },
      ),
      countersign.click(),
    ]);
    expect(signResponse.ok()).toBeTruthy();
    await this.page.reload({ waitUntil: 'load' });
    await expect(this.countersignRow()).toHaveCount(before - 1);
  }

  /**
   * Opens declined document rows until one shows the given reason (earlier
   * runs leave their own declined rows behind). Returns once found.
   */
  async expectDeclinedWithReason(reason: string) {
    await this.page.reload({ waitUntil: 'load' });
    const rows = this.declinedRow();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await rows.nth(i).click();
      const sheet = this.page.getByRole('dialog');
      if (
        await sheet
          .getByText(reason)
          .isVisible()
          .catch(() => false)
      ) {
        await expect(sheet.getByText('Decline reason')).toBeVisible();
        return;
      }
      await this.page.keyboard.press('Escape');
    }
    throw new Error(`No declined document row shows the reason: ${reason}`);
  }
}
