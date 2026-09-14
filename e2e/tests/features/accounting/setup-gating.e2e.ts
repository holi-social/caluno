import { mkdirSync } from 'node:fs';
import { type Browser, expect, test } from '@playwright/test';
import { BASE_URL } from '../../../pages/AuthPage';
import { AccountingTemplatesPage } from '../../../pages/accounting/AccountingTemplatesPage';
import { AdminReimbursementsPage } from '../../../pages/accounting/AdminReimbursementsPage';
import { LoginPage } from '../../../pages/LoginPage';

// The onboarding order the setup gating exists for: with no templates, the
// reimbursements board blocks document creation and points at the templates
// tab; configuring both templates for one Pauschale type lifts the block.
//
// The dev DB is stateful — the sibling documents-flow suite configures its own
// templates, and earlier runs leave theirs behind — so this spec resets the
// org's templates first to guarantee the no-templates starting state. It
// authenticates once and persists the session to .auth/ (storageState) like
// the sibling accounting spec.
const ADMIN_EMAIL = 'testing+admin@caluno.org';
const PASSWORD = 'abcd1234';

const adminAuthFile = '.auth/accounting-admin.json';

async function saveAuthState(
  browser: Browser,
  email: string,
  authFile: string,
) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, PASSWORD);
  await page.waitForURL(/\/en\/?$/, { timeout: 15_000 });
  await context.storageState({ path: authFile });
  await context.close();
}

test.describe('accounting setup gating — onboarding order', () => {
  test.beforeAll(async ({ browser }) => {
    mkdirSync('.auth', { recursive: true });
    await saveAuthState(browser, ADMIN_EMAIL, adminAuthFile);
  });

  test('creating documents stays blocked until a Pauschale type has both templates', async ({
    browser,
  }) => {
    const context = await browser.newContext({ storageState: adminAuthFile });
    const page = await context.newPage();

    const templates = new AccountingTemplatesPage(page);

    // /admin redirects to the admin's org; grab the org unit id from the URL.
    await page.goto(`${BASE_URL}/en/admin`, { waitUntil: 'load' });
    await page.waitForURL(/\/en\/admin\/[^/]+/, { timeout: 20_000 });
    const orgUnitId = new URL(page.url()).pathname.split('/')[3];

    // Start from a clean slate regardless of what earlier specs or runs left.
    await templates.goto(orgUnitId);
    await templates.resetTemplates();

    // 1. The reimbursements page shows the alert and Create is disabled.
    const board = new AdminReimbursementsPage(page);
    await board.goto(orgUnitId);
    await templates.expectSetupAlert();
    await expect(board.createDocumentButton).toBeDisabled();

    // 2. The alert's CTA navigates to the templates tab.
    await page.getByRole('link', { name: 'Go to templates' }).click();
    await page.waitForURL(/accounting\/settings\?tab=templates/, {
      timeout: 20_000,
    });
    await expect(
      page.getByRole('heading', { name: 'Document templates' }),
    ).toBeVisible();

    // 3. After configuring both templates for one Pauschale type, the alert
    // is gone and Create is enabled.
    await templates.configureTemplate('ehrenamt', 'contract');
    await templates.configureTemplate('ehrenamt', 'invoice');

    await board.goto(orgUnitId);
    await templates.expectNoSetupAlert();
    await expect(board.createDocumentButton).toBeEnabled();

    await context.close();
  });
});
