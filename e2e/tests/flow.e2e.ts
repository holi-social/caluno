import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrgPage } from '../pages/org/OrgPage';
import { SignupPage } from '../pages/SignupPage';
import { ShiftsPage } from '../pages/shifts/ShiftsPage';
import { TEST_PASSWORD, uniqueEmail } from '../utils/test-data';

// One user, one org, one shift per run, reused across every step.
test('auth -> org -> shifts -> create one shift', async ({ page }) => {
  const email = uniqueEmail();
  const orgName = `E2E Org ${Date.now()}`;
  const shiftName = `E2E Shift ${Date.now()}`;

  const signup = new SignupPage(page);
  const login = new LoginPage(page);
  const org = new OrgPage(page);
  const shifts = new ShiftsPage(page);
  let orgUId = '';

  await test.step('signup', async () => {
    console.log(`[STEP 1] signup            -> ${email}`);
    await signup.goto();
    await signup.signup('E2E User', email, TEST_PASSWORD);
    await signup.expectVerificationPrompt();
  });

  await test.step('login', async () => {
    console.log('[STEP 2] login             -> reuse same user');
    await page.context().clearCookies();
    await login.goto();
    await login.login(email, TEST_PASSWORD);
    await login.expectLoggedIn();
  });

  await test.step('create organization', async () => {
    await org.gotoCreate();
    orgUId = await org.createOrganization(orgName);
    console.log(`[STEP 3] org creation      -> ${orgName} (${orgUId})`);
  });

  await test.step('open shifts page', async () => {
    console.log('[STEP 4] shifts page       -> navigate + verify visible');
    await shifts.goto(orgUId);
    await shifts.expectLoaded();
  });

  await test.step('create one shift', async () => {
    console.log(`[STEP 5] shift creation    -> ${shiftName}`);
    await shifts.openCreateForm();
    await shifts.createShift(shiftName);
    await shifts.expectShiftCreated();
    console.log('[DONE ] shift created      -> success');
  });
});
