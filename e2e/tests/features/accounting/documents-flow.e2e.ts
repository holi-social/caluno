import { expect, type Page, test } from '@playwright/test';
import { BASE_URL } from '../../../pages/AuthPage';
import { AdminReimbursementsPage } from '../../../pages/accounting/AdminReimbursementsPage';
import { LoginPage } from '../../../pages/LoginPage';
import { VolunteerMembershipPage } from '../../../pages/volunteering/VolunteerMembershipPage';
import { VolunteerProfilePage } from '../../../pages/volunteering/VolunteerProfilePage';

// The whole document signing chain, both sides, against the local dev
// playground fixtures (apps/backend/src/database/fixtures.ts). Not
// self-contained like flow.e2e.ts — run with
// E2E_BASE_URL=http://localhost:3000 (my-shifts.e2e.ts precedent).
//
// Playground Member 02 is the volunteer (kept document-free in the fresh
// fixtures so the run's documents are uniquely identifiable); the admin is
// the Playground owner. The playground org has contract + invoice templates
// configured, and the admin holds the signing permission.
const ADMIN_EMAIL = 'testing+admin@caluno.org';
const VOLUNTEER_EMAIL = 'testing+002@caluno.org';
const PASSWORD = 'abcd1234';
const VOLUNTEER_NAME = 'Playground Member 02';
const DECLINE_REASON = `E2E decline ${Date.now()}: Zeitraum stimmt nicht`;

async function login(page: Page, email: string) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, PASSWORD);
  await page.waitForURL(/\/en\/?$/, { timeout: 15_000 });
}

test.describe('accounting documents flow — admin + volunteer', () => {
  test('admin creates → volunteer signs → admin countersigns → active; then a second document is declined with a reason', async ({
    browser,
  }) => {
    // ── Admin side ──────────────────────────────────────────────────────────
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await login(adminPage, ADMIN_EMAIL);

    // /admin redirects to the admin's org; grab the org unit id from the URL.
    await adminPage.goto(`${BASE_URL}/en/admin`, { waitUntil: 'load' });
    await adminPage.waitForURL(/\/en\/admin\/[^/]+/, { timeout: 20_000 });
    const orgUnitId = new URL(adminPage.url()).pathname.split('/')[3];

    const board = new AdminReimbursementsPage(adminPage);
    await board.goto(orgUnitId);
    await board.createContractFor(VOLUNTEER_NAME);

    // ── Volunteer side: the document is waiting for their signature ────────
    const volunteerContext = await browser.newContext();
    const volunteerPage = await volunteerContext.newPage();
    await login(volunteerPage, VOLUNTEER_EMAIL);

    const profile = new VolunteerProfilePage(volunteerPage);
    await profile.goto();
    const membershipUrl = await profile.openMembership();

    const membership = new VolunteerMembershipPage(volunteerPage);
    await membership.goto(membershipUrl);
    await membership.expectCardsVisible();
    await membership.signAwaitingCard();

    // ── Admin side: it has moved on and is waiting on them ──────────────────
    await board.countersignContract(VOLUNTEER_NAME);

    // ── Volunteer side: fully signed, both signatures on the card ──────────
    await volunteerPage.reload({ waitUntil: 'load' });
    const signedCard = membership.cardForState('signed').first();
    await expect(signedCard).toContainText('Active');
    await expect(signedCard).toContainText('You signed on');
    await expect(signedCard).toContainText('countersigned on');
    await expect(
      signedCard.getByRole('button', { name: 'Download' }),
    ).toBeVisible();

    // ── Second document: the volunteer declines it with a reason ───────────
    await board.createContractFor(VOLUNTEER_NAME);
    await volunteerPage.reload({ waitUntil: 'load' });
    await membership.declineAwaitingCard(DECLINE_REASON);

    // The org's dashboard reads Declined, attributed to the volunteer, with
    // the reason shown in full.
    await board.expectDeclinedWithReason(DECLINE_REASON);

    await adminContext.close();
    await volunteerContext.close();
  });
});
