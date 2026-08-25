import { expect, test } from '@playwright/test';
import { BASE_URL } from '../pages/AuthPage';
import { LoginPage } from '../pages/LoginPage';

// These specs depend on the local dev seed fixtures
// (apps/backend/src/database/fixtures.ts, `bun run db:fixtures`) — they are
// not self-contained like flow.e2e.ts and only make sense against a local
// dev server: run with E2E_BASE_URL=http://localhost:3000.
//
// member02 is the fixture account with the "Overlap Test Pair"
// (2 overlapping shifts) and "Overlap Test Pile" (6 overlapping shifts,
// A-F) fixtures invited to it — member01 is kept conflict-free as a
// baseline for other manual checks.
const MEMBER_EMAIL = 'testing+002@caluno.org';
const MEMBER_PASSWORD = 'abcd1234';

test.describe('my-shifts conflict clustering + day strip', () => {
  test.beforeEach(async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.login(MEMBER_EMAIL, MEMBER_PASSWORD);
    // Not `login.expectLoggedIn()` — that also asserts a "Home" heading which
    // doesn't exist on the real volunteer home page (only fresh org-less
    // signups land on a page with that heading), just the redirect off /login.
    await page.waitForURL(/\/en\/?$/, { timeout: 15000 });

    await page.goto(`${BASE_URL}/en/my-shifts`, { waitUntil: 'load' });
    // DetailPageHeader's title renders as a styled <span>, not a heading role.
    await expect(page.getByText('Your shifts', { exact: true })).toBeVisible();
  });

  test('renders a 2-shift conflict side by side with an overlap warning', async ({
    page,
  }) => {
    const pairA = page.getByText('Overlap Test Pair A');
    await pairA.scrollIntoViewIfNeeded();

    await expect(pairA).toBeVisible();
    await expect(page.getByText('Overlap Test Pair B')).toBeVisible();
    await expect(
      page.getByText('You have overlapping shifts in your schedule').first(),
    ).toBeVisible();

    // Side by side, not stacked: different columns (x differs substantially).
    // Not comparing y — the actionable card (Pair A, if it's the "next"
    // shift) has an extra timer-badge row above its title, so its title
    // text sits lower than Pair B's even though the cards share a grid row.
    const boxA = await pairA.boundingBox();
    const boxB = await page.getByText('Overlap Test Pair B').boundingBox();
    expect(boxA).not.toBeNull();
    expect(boxB).not.toBeNull();
    if (boxA && boxB) {
      expect(Math.abs(boxA.x - boxB.x)).toBeGreaterThan(200);
    }

    // A cluster this small (2) never gets a "+N more" collapse toggle — only
    // clusters over the 5-visible threshold do (see the pile test below).
    // Scoped to this day's group, since the page also has the 6-shift pile
    // cluster (on a different day) with its own "+1 more" toggle.
    const pairDayGroup = page.locator('[data-day]', { has: pairA });
    await expect(pairDayGroup.getByText(/\+\d+ more/)).toHaveCount(0);
  });

  test('a conflict cluster over 5 shifts shows the first 5 and collapses the rest behind "+N more"', async ({
    page,
  }) => {
    // Fixture cluster is 6 shifts (Pile A-F) — expect A-E visible up front,
    // F collapsed behind "+1 more", with no fanned/hidden-card trick: all 5
    // visible cards must be individually readable, not just the first one.
    const moreToggle = page.getByText('+1 more');
    await moreToggle.scrollIntoViewIfNeeded();

    for (const letter of ['A', 'B', 'C', 'D', 'E']) {
      await expect(page.getByText(`Overlap Test Pile ${letter}`)).toBeVisible();
    }
    await expect(page.getByText('Overlap Test Pile F')).toHaveCount(0);
    await expect(moreToggle).toBeVisible();

    await moreToggle.click();

    await expect(page.getByText('Overlap Test Pile F')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Show less' })).toBeVisible();
    await expect(page.getByText(/\+\d+ more/)).toHaveCount(0);

    await page.getByRole('button', { name: 'Show less' }).click();
    await expect(page.getByText('Overlap Test Pile F')).toHaveCount(0);
    await expect(moreToggle).toBeVisible();
  });

  test('day strip only shows shift-days, with gap dividers for multi-day gaps', async ({
    page,
  }) => {
    const strip = page.getByRole('tablist', { name: 'Day selector' });
    await expect(strip).toBeVisible();

    const counts = await strip.evaluate((el) => ({
      children: el.children.length,
      tabs: el.querySelectorAll('[role="tab"]').length,
    }));

    // Every child is either a day pill (role=tab) or a gap divider — with
    // this fixture data (weekly Mon/Wed shifts + one-off overlap shifts),
    // there should be at least one multi-day gap collapsed to a divider.
    expect(counts.tabs).toBeGreaterThan(0);
    expect(counts.children).toBeGreaterThan(counts.tabs);
  });

  test('"Go to top" scrolls back to the closest-upcoming day after scrolling away', async ({
    page,
  }) => {
    // The list includes past shifts too (includePast: true), so "the first
    // heading in the DOM" isn't what "Go to top" targets — it targets the
    // closest-upcoming day, which is wherever the page's own initial-scroll
    // effect already landed on load. Capture that, not `h3.first()` — but
    // only after that effect has actually run (it fires post-mount, so
    // reading immediately after navigation can still catch scrollY=0).
    await page.waitForTimeout(1000);
    const landingHeadingText = await page.evaluate(() => {
      const header = document.querySelector('.sticky');
      const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
      const headings = [...document.querySelectorAll('[data-day] h3')];
      const active = headings.find(
        (h) => h.getBoundingClientRect().top >= headerBottom,
      );
      return (active ?? headings[headings.length - 1])?.textContent ?? '';
    });
    expect(landingHeadingText).not.toBe('');

    await page.mouse.wheel(0, 8000);
    await page.waitForTimeout(300);
    await expect(
      page.getByText(landingHeadingText).first(),
    ).not.toBeInViewport();

    await page.getByRole('button', { name: 'Go to top' }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(landingHeadingText).first()).toBeInViewport();
  });

  test('"Check in" hands off to the QR check-in tab instead of checking in directly', async ({
    page,
  }) => {
    // The check-in button only renders when the member's next shift is
    // "starting soon" or overdue (ShiftCardMy's `showCheckIn`) — whether
    // that's true depends on wall-clock time relative to the fixture data,
    // not something this suite controls. Verify the behavior when the
    // button is present; skip rather than flake when it isn't.
    const checkInLink = page.locator('a', { hasText: 'Check in' }).first();
    const isPresent = (await checkInLink.count()) > 0;
    test.skip(
      !isPresent,
      'No shift currently in the "starts soon" check-in window for this fixture data',
    );

    await expect(checkInLink).toHaveAttribute('href', /\/qr-id$/);

    await checkInLink.click();
    await page.waitForURL(/\/qr-id$/, { timeout: 10000 });
  });
});
