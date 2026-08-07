import { type BrowserContext, expect, type Page } from '@playwright/test';

// Public Mailinator inbox, driven through its website (no API / token).
const PUBLIC_INBOX = 'https://www.mailinator.com/v4/public/inboxes.jsp';

export class MailinatorPage {
  constructor(private readonly page: Page) {}

  // A unique public inbox per run — e.g. caluno-e2e-123@mailinator.com.
  static uniqueInbox(prefix = 'caluno-e2e'): {
    inbox: string;
    emailAddress: string;
  } {
    const inbox = `${prefix}-${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return { inbox, emailAddress: `${inbox}@mailinator.com` };
  }

  // Opens the public inbox in its own tab.
  static async open(
    context: BrowserContext,
    inbox: string,
  ): Promise<MailinatorPage> {
    const page = await context.newPage();
    const mailinator = new MailinatorPage(page);
    await page.goto(`${PUBLIC_INBOX}?to=${encodeURIComponent(inbox)}`, {
      waitUntil: 'domcontentloaded',
    });
    return mailinator;
  }

  private get messageRows() {
    return this.page.locator('#inbox_pane tr[ng-repeat]');
  }

  async close() {
    await this.page.close();
  }

  /**
   * Waits for the verification email, opens it, and returns its 6-digit code.
   * Opens the inbox once and relies on Mailinator's live refresh (no reloading
   * or polling, which triggers a temporary block). Throws clearly if no email
   * arrives or no code can be extracted.
   */
  async getVerificationCode(timeoutMs = 90_000): Promise<string> {
    try {
      await this.messageRows
        .first()
        .waitFor({ state: 'visible', timeout: timeoutMs });
    } catch {
      throw new Error(
        `No verification email arrived in the Mailinator inbox within ${timeoutMs}ms`,
      );
    }

    await this.messageRows.first().click();

    // The body renders into an iframe just after opening; retry the read until
    // the code is present (auto-retry, no fixed sleep).
    let body = '';
    try {
      await expect(async () => {
        body = await this.readOpenedEmail();
        expect(body).toMatch(/\b\d{6}\b/);
      }).toPass({ timeout: 15_000 });
    } catch {
      throw new Error(
        'Verification email opened but no 6-digit code was found in its content',
      );
    }

    return (body.match(/\b(\d{6})\b/) as RegExpMatchArray)[1];
  }

  // Reads the opened email — HTML and text body parts, plus the subject pane.
  private async readOpenedEmail(): Promise<string> {
    const html = await this.page
      .frameLocator('#html_msg_body')
      .locator('body')
      .innerText({ timeout: 2_000 })
      .catch(() => '');
    const text = await this.page
      .frameLocator('#texthtml_msg_body')
      .locator('body')
      .innerText({ timeout: 2_000 })
      .catch(() => '');
    const pane = await this.page
      .locator('#email_pane')
      .innerText()
      .catch(() => '');
    return `${html}\n${text}\n${pane}`;
  }
}
