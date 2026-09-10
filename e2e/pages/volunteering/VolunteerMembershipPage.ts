import { expect, type Locator, type Page } from '@playwright/test';

/**
 * One membership's page (`/profile/memberships/[id]`) — its "Your
 * documents" section lists the volunteer's contracts and timesheets with
 * state-driven actions.
 */
export class VolunteerMembershipPage {
  constructor(private readonly page: Page) {
    // Signing is gated on the PDF preview having rendered. Headless Chromium
    // has no PDF viewer, so the preview iframe never fires onLoad and the Sign
    // button stays disabled. Serve the preview iframe a tiny HTML document
    // instead; the real signing mutation still runs against the API. Only the
    // iframe navigation is stubbed, so downloads of the real PDF still work.
    page.route(/\/document\/[^/]+\.pdf/, (route) => {
      const request = route.request();
      if (
        request.resourceType() === 'document' &&
        request.frame() !== page.mainFrame()
      ) {
        return route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: '<!doctype html><p>preview</p>',
        });
      }
      return route.continue();
    });
  }

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

    // The card's Sign opens the document preview page. Signing there is gated
    // on the preview having rendered, so wait for the footer Sign to enable
    // (the preview iframe is stubbed above), then sign.
    await awaiting.getByRole('button', { name: 'Sign', exact: true }).click();
    await this.page.waitForURL(/\/documents\/[^/]+\?kind=/, {
      timeout: 15_000,
    });

    const previewSign = this.page.getByRole('button', {
      name: 'Sign',
      exact: true,
    });
    await expect(previewSign).toBeEnabled({ timeout: 30_000 });
    const [signResponse] = await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes('/graphql') &&
          (response.request().postData() ?? '').includes('SignContract'),
        { timeout: 20_000 },
      ),
      previewSign.click(),
    ]);
    expect(signResponse.ok()).toBeTruthy();

    // Back on the membership page the card has flipped to waiting on the org,
    // and nothing but Download remains.
    await this.page.goBack({ waitUntil: 'load' });
    await this.page.reload({ waitUntil: 'load' });
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
