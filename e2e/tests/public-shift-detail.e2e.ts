import { expect, test } from '@playwright/test';
import { BASE_URL } from '../pages/AuthPage';

const EVENT_ASSISTANCE_SHIFT_ID = 'e2915169-290d-42b2-a2e2-6d9992bb8814';
const UNKNOWN_SHIFT_ID = '00000000-0000-0000-0000-000000000000';

test.describe('public shift detail page', () => {
  test('renders shift title and org name', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/shifts/${EVENT_ASSISTANCE_SHIFT_ID}`);
    await expect(page.locator('h1')).toContainText('Event Assistance');
    await expect(page.getByText('Playground')).toBeVisible();
  });

  test('shows event badge when shift is part of an event', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/shifts/${EVENT_ASSISTANCE_SHIFT_ID}`);
    await expect(
      page.getByRole('link', { name: /public test event/i }),
    ).toBeVisible();
  });

  test('returns 404 for unknown shift', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/shifts/${UNKNOWN_SHIFT_ID}`);
    await expect(
      page.getByRole('heading', { name: 'This page could not be found.' }),
    ).toBeVisible();
  });

  test('shows invite-only state for invite-only shift', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/shifts/${EVENT_ASSISTANCE_SHIFT_ID}`);
    await expect(
      page.getByRole('button', { name: /invite only/i }),
    ).toBeVisible();
  });
});
