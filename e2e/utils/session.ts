import type { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SignupPage } from '../pages/SignupPage';
import { TEST_PASSWORD, uniqueEmail } from './test-data';

export interface TestCredentials {
  email: string;
  password: string;
}

// Registers a fresh account and logs in with it; returns the credentials.
export async function signUpAndLogin(page: Page): Promise<TestCredentials> {
  const email = uniqueEmail();

  const signup = new SignupPage(page);
  await signup.goto();
  await signup.signup('E2E User', email, TEST_PASSWORD);
  await signup.expectVerificationPrompt();

  await page.context().clearCookies();

  const login = new LoginPage(page);
  await login.goto();
  await login.login(email, TEST_PASSWORD);
  await login.expectLoggedIn();

  return { email, password: TEST_PASSWORD };
}
