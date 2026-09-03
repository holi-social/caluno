# caluno-e2e

End-to-end tests for Caluno, using [Playwright](https://playwright.dev) with a
Page Object Model. Runs against the deployed staging app.

## Structure

```
e2e/
├── pages/                 # Page objects (one class per screen)
│   ├── AuthPage.ts        # shared base: base URL, email/password fields
│   ├── LoginPage.ts
│   ├── SignupPage.ts
│   ├── VerifyEmailPage.ts
│   ├── org/OrgPage.ts
│   └── shifts/ShiftsPage.ts
├── fixtures/
│   └── shift.ts           # reusable shift specs for the creation suite
├── utils/
│   ├── auth.ts            # signUpVerifyAndLogin helper
│   ├── mailbox.ts         # Mailpit client: reads verification codes
│   ├── session.ts         # signUpAndLogin helper
│   └── test-data.ts       # password + unique email generator
├── tests/
│   ├── flow.e2e.ts        # the end-to-end journey (smoke)
│   └── features/          # focused suites (auth, org, shifts)
└── playwright.config.ts
```


## Running

From this directory (`e2e`):

```bash
bun playwright test                 # run the suite
bun playwright test --reporter=html # run + generate HTML report
bun playwright show-report          # open the last HTML report
```

Browsers install once with `bun playwright install chromium`.
Target another environment with `E2E_BASE_URL=https://... bun playwright test`
(defaults to staging).

### Email verification

Staging sends all mail to a shared [Mailpit](https://mailpit.axllent.org) sink
(a catch-all SMTP server with a REST API). The suite reads the verification code
from it via `utils/mailbox.ts` — signup uses a unique `@example.com` recipient
per run and polls Mailpit for the matching message.

The mailbox is behind basic auth. Defaults target staging; override with env vars:

```bash
MAILBOX_URL=https://staging.mailbox.caluno.org \
MAILBOX_USER=mailpit \
MAILBOX_PASSWORD=... \
bun playwright test
```

Prefer supplying `MAILBOX_PASSWORD` via a CI secret rather than relying on the
committed default.

## Conventions

- **Specs use the `*.e2e.ts` suffix** so the repo's `bun test` runner ignores
  them (Playwright and Bun otherwise share `*.spec.ts` / `*.test.ts`).
- **Selectors** are role- and label-based, captured from the live app — not guessed.
- **Waits** are locator- and URL-driven (`waitForURL`, `waitFor`); no
  `networkidle` and no fixed sleeps.
- Each run **provisions data on staging** (one user, org, and shift).
- `test-results/` and `playwright-report/` are git-ignored.
```
