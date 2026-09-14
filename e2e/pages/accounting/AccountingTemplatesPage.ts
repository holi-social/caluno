import { expect, type Page } from '@playwright/test';
import { BASE_URL } from '../AuthPage';

export type PauschalenType = 'ehrenamt' | 'uebungsleiter';
export type TemplateKind = 'contract' | 'invoice';

// URL slugs are `${pauschale}spauschale-${kind}` (see template/types.ts
// SLUG_TO_SLOT on the frontend).
const PAUSCHALE_SLUG: Record<PauschalenType, string> = {
  ehrenamt: 'ehrenamtspauschale',
  uebungsleiter: 'uebungsleiterpauschale',
};

// react-day-picker's day buttons carry an English accessible name like
// "Tuesday, September 1st, 2026" — weekday, month, ordinal day, year — with a
// "Today, " prefix on the current day. Spelled out rather than derived from
// Intl so the label is deterministic across the test runner's ICU data.
const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function ordinalSuffix(day: number): string {
  const mod100 = day % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  switch (day % 10) {
    case 1:
      return 'st';
    case 2:
      return 'nd';
    case 3:
      return 'rd';
    default:
      return 'th';
  }
}

/** Matches the day button's accessible name, with an optional "Today, " prefix. */
function dayButtonName(date: Date): RegExp {
  const label = `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}${ordinalSuffix(date.getDate())}, ${date.getFullYear()}`;
  return new RegExp(
    `^(Today, )?${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
  );
}

/**
 * The accounting settings → templates tab and the per-slot builder
 * (`/admin/[orgUId]/accounting/settings/templates/<slug>`). Used to seed an
 * org's templates when a suite cannot rely on the fixtures providing them.
 *
 * The dev DB is stateful, so the spec using this page can `resetTemplates()`
 * first (soft-deletes every active template for the org through the app's own
 * GraphQL API) to guarantee the "no templates" onboarding state.
 */
export class AccountingTemplatesPage {
  private orgUnitId: string | null = null;
  private graphqlUrl: string | null = null;

  constructor(private readonly page: Page) {
    // Capture the app's GraphQL endpoint (the frontend talks to the API
    // directly, so it is not derivable from BASE_URL alone).
    page.on('request', (request) => {
      if (this.graphqlUrl || request.method() !== 'POST') return;
      const url = new URL(request.url());
      if (url.pathname === '/graphql') {
        this.graphqlUrl = `${url.origin}/graphql`;
      }
    });
  }

  async goto(orgUnitId: string) {
    this.orgUnitId = orgUnitId;
    await this.page.goto(
      `${BASE_URL}/en/admin/${orgUnitId}/accounting/settings?tab=templates`,
      { waitUntil: 'load' },
    );
  }

  setupAlert() {
    // Next.js renders an empty route announcer with role="alert" too; the
    // setup alert is the one carrying a CTA link.
    return this.page
      .getByRole('alert')
      .filter({ has: this.page.getByRole('link') });
  }

  async expectSetupAlert() {
    await expect(this.setupAlert()).toBeVisible();
  }

  async expectNoSetupAlert() {
    await expect(this.setupAlert()).toHaveCount(0);
  }

  private requireOrgUnitId(): string {
    if (!this.orgUnitId) {
      throw new Error('AccountingTemplatesPage.goto(orgUnitId) must run first');
    }
    return this.orgUnitId;
  }

  private async graphql<T>(
    query: string,
    variables?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.graphqlUrl) {
      throw new Error('GraphQL endpoint was not observed from the app yet');
    }
    const response = await this.page.request.post(this.graphqlUrl, {
      headers: { 'x-organization-unit-id': this.requireOrgUnitId() },
      data: { query, variables },
    });
    const body = (await response.json()) as {
      data?: T;
      errors?: unknown[];
    };
    if (body.errors) {
      throw new Error(`GraphQL error: ${JSON.stringify(body.errors)}`);
    }
    return body.data as T;
  }

  /**
   * Soft-deletes every active template of the org, returning the org to the
   * no-templates state the onboarding gate expects. There is no delete action
   * in the UI, so this goes through the app's own GraphQL API with the page's
   * authenticated session.
   */
  async resetTemplates() {
    const data = await this.graphql<{ documentTemplates: { id: string }[] }>(
      'query { documentTemplates { id } }',
    );
    for (const template of data.documentTemplates) {
      await this.graphql(
        'mutation($id: ID!) { deleteDocumentTemplate(id: $id) }',
        { id: template.id },
      );
    }
  }

  private builderUrl(pauschale: PauschalenType, kind: TemplateKind): string {
    return `${BASE_URL}/en/admin/${this.requireOrgUnitId()}/accounting/settings/templates/${PAUSCHALE_SLUG[pauschale]}-${kind}`;
  }

  /**
   * Opens a slot's builder and saves its preset. The contract builder's Save
   * stays disabled until its manual fields (task description, period, hours)
   * are filled; the invoice builder is saveable as-is. Returns once the app
   * has navigated back to the templates list.
   */
  async configureTemplate(pauschale: PauschalenType, kind: TemplateKind) {
    await this.page.goto(this.builderUrl(pauschale, kind), {
      waitUntil: 'load',
    });

    const save = this.page.getByRole('button', { name: 'Save template' });
    await expect(save).toBeVisible();

    // A slot that is already configured loads its saved body, so its manual
    // fields are filled and Save is enabled — filling them again would fail
    // (the period trigger then reads the saved range, not "Select period").
    // Only fill the contract's required manual fields on a fresh slot.
    if (kind === 'contract' && (await save.isDisabled())) {
      await this.page
        .getByRole('textbox', { name: 'Task description' })
        .fill('Support community events');

      await this.page.getByRole('button', { name: 'Select period' }).click();
      await this.page.getByRole('tab', { name: 'Period' }).click();

      const today = new Date();
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const tenthOfMonth = new Date(today.getFullYear(), today.getMonth(), 10);
      await this.page
        .getByRole('button', { name: dayButtonName(firstOfMonth) })
        .click();
      await this.page
        .getByRole('button', { name: dayButtonName(tenthOfMonth) })
        .click();

      await this.page.getByRole('button', { name: 'Apply' }).click();
      await this.page.getByRole('spinbutton', { name: 'Hours' }).fill('10');
    }

    await expect(save).toBeEnabled();
    await save.click();

    await this.page.waitForURL(/accounting\/settings\?tab=templates/, {
      timeout: 20_000,
    });
  }
}
