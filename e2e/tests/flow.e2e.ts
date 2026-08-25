import { test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MailinatorPage } from '../pages/MailinatorPage';
import { OrgPage } from '../pages/org/OrgPage';
import { SignupPage } from '../pages/SignupPage';
import { ShiftsPage } from '../pages/shifts/ShiftsPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { TEST_PASSWORD } from '../utils/test-data';

/**
 * Smoke — full happy path. The only suite that creates a real account.
 * Signup -> Email Verification -> Login -> Create Organization -> Create Shift.
 * The verification code is read from a Mailinator public inbox (see MailinatorPage).
 */
test('signup -> verify email -> login -> create org -> create shift', async ({
  page,
  context,
}) => {
  const { inbox, emailAddress } = MailinatorPage.uniqueInbox();
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
    const mailinator = await MailinatorPage.open(context, inbox);
    const code = await mailinator.getVerificationCode();
    await mailinator.close();
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
    await shifts.createShift(shiftName);
    await shifts.expectShiftCreated();
  });
});
