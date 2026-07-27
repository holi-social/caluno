import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { MailinatorPage } from '../pages/MailinatorPage';
import { SignupPage } from '../pages/SignupPage';
import { VerifyEmailPage } from '../pages/VerifyEmailPage';
import { TEST_PASSWORD } from './test-data';

export interface TestAccount {
  email: string;
  password: string;
}

// Signup -> verify email (Mailinator) -> login. Leaves `page` authenticated.
export async function signUpVerifyAndLogin(page: Page): Promise<TestAccount> {
  const { inbox, emailAddress } = MailinatorPage.uniqueInbox();

  const signup = new SignupPage(page);
  await signup.goto();
  await signup.signup('E2E User', emailAddress, TEST_PASSWORD);
  await signup.expectVerificationPrompt();

  const mailinator = await MailinatorPage.open(page.context(), inbox);
  const code = await mailinator.getVerificationCode();
  await mailinator.close();

  const verify = new VerifyEmailPage(page);
  await verify.verify(code);

  await page.context().clearCookies();
  const login = new LoginPage(page);
  await login.goto();
  await login.login(emailAddress, TEST_PASSWORD);
  await login.expectLoggedIn();

  return { email: emailAddress, password: TEST_PASSWORD };
}
