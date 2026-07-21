# clippy-e2e

End-to-end tests for Clippy, using [Playwright](https://playwright.dev) with a
Page Object Model. Runs against the deployed staging app.

## Structure

```
e2e/
├── pages/                 # Page objects (one class per screen)
│   ├── AuthPage.ts        # shared base: base URL, email/password fields
│   ├── LoginPage.ts
│   ├── SignupPage.ts
│   ├── org/OrgPage.ts
│   └── shifts/ShiftsPage.ts
├── utils/
│   ├── session.ts         # signUpAndLogin helper
│   └── test-data.ts       # password + unique email generator
├── tests/
│   └── flow.e2e.ts        # the end-to-end journey
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

The smoke flow reads the verification code from a [Mailinator](https://www.mailinator.com)
**public** inbox, driven through the Mailinator website (`pages/MailinatorPage.ts`).
No account, API token, or extra configuration is required.

## Conventions

- **Specs use the `*.e2e.ts` suffix** so the repo's `bun test` runner ignores
  them (Playwright and Bun otherwise share `*.spec.ts` / `*.test.ts`).
- **Selectors** are role- and label-based, captured from the live app — not guessed.
- **Waits** are locator- and URL-driven (`waitForURL`, `waitFor`); no
  `networkidle` and no fixed sleeps.
- Each run **provisions data on staging** (one user, org, and shift).
- `test-results/` and `playwright-report/` are git-ignored.
```
