import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { OrgPage } from '../pages/org/OrgPage';
import { SignupPage } from '../pages/SignupPage';
import { ShiftsPage } from '../pages/shifts/ShiftsPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { Mailbox } from '../utils/mailbox';
import { TEST_PASSWORD } from '../utils/test-data';

/**
 * Smoke — full happy path. The only suite that creates a real account.
 * Signup -> Email Verification -> Login -> Create Organization -> Create Shift.
 * The verification code is read from the Mailpit mailbox (see utils/mailbox).
 */
test('signup -> verify email -> login -> create org -> create shift', async ({
  page,
}) => {
  const emailAddress = Mailbox.uniqueAddress();
  const orgName = `E2E Org ${Date.now()}`;
  const shiftName = `E2E Shift ${Date.now()}`;

  const signup = new SignupPage(page);
  const verify = new VerifyEmailPage(page);
  const login = new LoginPage(page);
  const org = new OrgPage(page);
  const shifts = new ShiftsPage(page);
  let orgUId = '';

  await test.step('signup', async () => {
    await signup.goto();
    await signup.signup('E2E User', emailAddress, TEST_PASSWORD);
    await signup.expectVerificationPrompt();
  });

  await test.step('verify email', async () => {
    const code = await Mailbox.getVerificationCode(emailAddress);
    await verify.verify(code);
  });

  await test.step('login', async () => {
    await page.context().clearCookies();
    await login.goto();
    await login.login(emailAddress, TEST_PASSWORD);
    await login.expectLoggedIn();
  });

  await test.step('create organization', async () => {
    await org.gotoCreate();
    orgUId = await org.createOrganization(orgName);
  });

  await test.step('open shifts page', async () => {
    await shifts.goto(orgUId);
    await shifts.expectLoaded();
  });

  await test.step('create shift', async () => {
    await shifts.openCreateForm();
    await shifts.createShift({
      name: shiftName,
      startTime: '09:00',
      endTime: '17:00',
      recurrence: 'Does not repeat',
      openShift: true,
    });
    await shifts.expectShiftCreated();
  });
});
