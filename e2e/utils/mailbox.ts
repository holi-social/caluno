import { request } from '@playwright/test';

// Staging mail goes to a shared Mailpit sink with a REST API behind basic auth.
// Prefer setting MAILBOX_PASSWORD via a CI secret over the committed default.
const MAILBOX_URL =
  process.env.MAILBOX_URL ?? 'https://staging.mailbox.caluno.org';
const MAILBOX_USER = process.env.MAILBOX_USER ?? 'mailpit';
const MAILBOX_PASSWORD = process.env.MAILBOX_PASSWORD ?? '3%vBBfEM';

const authHeader = `Basic ${Buffer.from(`${MAILBOX_USER}:${MAILBOX_PASSWORD}`).toString('base64')}`;

// biome-ignore lint/complexity/noStaticOnlyClass: namespacing mailbox helpers under a class for a cleaner import surface
export class Mailbox {
  // Unique recipient per run; Mailpit accepts any domain.
  static uniqueAddress(prefix = 'clippy-e2e'): string {
    const unique = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    return `${prefix}-${unique}@example.com`;
  }

  // Polls Mailpit for the verification email to `address` and returns its
  // 6-digit code.
  static async getVerificationCode(
    address: string,
    timeoutMs = 60_000,
  ): Promise<string> {
    const api = await request.newContext({
      baseURL: MAILBOX_URL,
      extraHTTPHeaders: { Authorization: authHeader },
      // Don't inherit the suite's storageState (may not exist yet in beforeAll).
      storageState: undefined,
    });
    try {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const search = await api.get('/api/v1/search', {
          params: { query: `to:${address}` },
        });
        const { messages } = await search.json();
        if (messages?.length) {
          const message = await api.get(`/api/v1/message/${messages[0].ID}`);
          const { Text, HTML } = await message.json();
          const code = `${Text ?? ''}\n${HTML ?? ''}`.match(/\b(\d{6})\b/);
          if (code) return code[1];
        }
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
      throw new Error(
        `No verification email for ${address} in the mailbox within ${timeoutMs}ms`,
      );
    } finally {
      await api.dispose();
    }
  }
}
