import { expect, test } from '@playwright/test';
import { BASE_URL } from '../pages/AuthPage';

// Depends on the local dev seed fixtures (apps/backend/src/database/fixtures.ts)
// — run with E2E_BASE_URL=http://localhost:3000.
const PUBLIC_EVENT_ID = '213e6757-af0c-4ce3-ba29-fb3500309351';
const EVENT_ASSISTANCE_SHIFT_ID = 'e2915169-290d-42b2-a2e2-6d9992bb8814';

test.describe('public event detail page', () => {
  test('renders event title and org name', async ({ page }) => {
    await page.goto(`${BASE_URL}/en/events/${PUBLIC_EVENT_ID}`);
    await expect(page.locator('h1')).toContainText('Public Test Event');
    await expect(page.getByRole('link', { name: 'Playground' })).toBeVisible();
  });

  test('returns 404 for unknown event', async ({ page }) => {
    await page.goto(
      `${BASE_URL}/en/events/00000000-0000-0000-0000-000000000000`,
    );
    await expect(
      page.getByRole('heading', { name: 'This page could not be found.' }),
    ).toBeVisible();
  });

  test('redirects anonymous follow click to signup with invite context', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/events/${PUBLIC_EVENT_ID}`);
    await page.getByRole('button', { name: /step up to help/i }).click();
    await expect(page).toHaveURL(/\/en\/signup/);
    await expect(
      page.getByRole('heading', { name: /join playground/i }),
    ).toBeVisible();
    await expect(page.getByText(/powered by/i)).toBeVisible();
    await expect(page.getByText('caluno')).toBeVisible();
  });

  test('shows event badge on shift detail when part of event', async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/en/shifts/${EVENT_ASSISTANCE_SHIFT_ID}`);
    await expect(page.getByRole('link', { name: /event/i })).toBeVisible();
  });
});
