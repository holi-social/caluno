import { expect, type Locator, type Page } from '@playwright/test';

/**
 * One membership's page (`/profile/memberships/[id]`) — its "Your
 * documents" section lists the volunteer's contracts and timesheets with
 * state-driven actions.
 */
export class VolunteerMembershipPage {
  constructor(private readonly page: Page) {}

  async goto(url: string) {
    await this.page.goto(url, { waitUntil: 'load' });
  }

  get documentsHeading() {
    return this.page.getByRole('heading', { name: 'Your documents' });
  }

  /** A document card in the given display state (data-state attribute). */
  cardForState(state: string): Locator {
    return this.page.locator(
      `[data-testid="volunteer-document-card"][data-state="${state}"]`,
    );
  }

  async expectCardsVisible() {
    await expect(this.documentsHeading).toBeVisible();
    await expect(
      this.page.getByText('Agreements and timesheets for reimbursements'),
    ).toBeVisible();
  }

  /**
   * Signs the newest card awaiting the volunteer's signature (cards sort
   * newest-first within the awaiting group, so `.first()` is the document
   * just created for this run). Afterwards the freshly signed card is the
   * only one in the awaiting-countersignature state.
   */
  async signAwaitingCard() {
    const awaiting = this.cardForState('awaiting-signature').first();
    await expect(awaiting).toBeVisible();
    await expect(awaiting).toContainText('To sign');
    await expect(
      awaiting.getByRole('button', { name: 'Sign', exact: true }),
    ).toBeVisible();
    await expect(
      awaiting.getByRole('button', { name: 'Decline', exact: true }),
    ).toBeVisible();
    await expect(
      awaiting.getByRole('button', { name: 'Download', exact: true }),
    ).toBeVisible();

    await awaiting.getByRole('button', { name: 'Sign', exact: true }).click();

    // One tap, no confirmation: the card flips to waiting on the org, and
    // nothing but Download remains.
    const signed = this.cardForState('awaiting-countersignature').first();
    await expect(signed).toContainText('To countersign');
    await expect(
      signed.getByRole('button', { name: 'Sign', exact: true }),
    ).toHaveCount(0);
    await expect(
      signed.getByRole('button', { name: 'Decline', exact: true }),
    ).toHaveCount(0);
    await expect(
      signed.getByRole('button', { name: 'Download', exact: true }),
    ).toBeVisible();
  }

  /** Declines the card currently awaiting the volunteer's signature. */
  async declineAwaitingCard(reason: string) {
    const card = this.cardForState('awaiting-signature').first();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Decline', exact: true }).click();

    const sheet = this.page.getByRole('dialog');
    await expect(sheet.getByText('Decline document')).toBeVisible();

    const reasonField = sheet.getByLabel('Reason for declining');
    await expect(reasonField).toBeVisible();

    // A decline always carries a written reason — confirm stays disabled.
    const confirm = sheet.getByRole('button', { name: 'Decline' });
    await expect(confirm).toBeDisabled();
    await reasonField.fill(reason);
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // Permanently declined, download-only, with the reason on the card.
    const declinedCard = this.cardForState('declined').filter({
      hasText: reason,
    });
    await expect(declinedCard).toBeVisible();
    await expect(
      declinedCard.getByRole('button', { name: 'Sign', exact: true }),
    ).toHaveCount(0);
    await expect(
      declinedCard.getByRole('button', { name: 'Download', exact: true }),
    ).toBeVisible();
  }
}
