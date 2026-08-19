import { expect, test } from '@playwright/test';
import { OrgPage } from '../../../pages/org/OrgPage';
import { signUpVerifyAndLogin } from '../../../utils/auth';

// Frontend-only validation of the create-organization form. Auth once per worker
// (storageState); no org is created — invalid fields block native submission.

const authFile = '.auth/org-user.json';
const CREATE_FORM = /\/admin\/create-organization/;

// 1x1 transparent PNG used to exercise the logo upload.
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMEAYEjQ4dpAAAAAElFTkSuQmCC',
  'base64',
);

test.describe('Organization creation validation', () => {
  test.use({ storageState: authFile });

  let org: OrgPage;

  test.beforeAll(async ({ browser }) => {
    // Fresh, unauthenticated context (override the suite's storageState).
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await signUpVerifyAndLogin(page);
    await context.storageState({ path: authFile });
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    org = new OrgPage(page);
    await org.gotoCreate();
    await expect(org.nameInput).toBeVisible();
  });

  test.describe('form structure', () => {
    test('shows all organization fields and controls', async () => {
      await expect(org.nameInput).toBeVisible();
      await expect(org.descriptionInput).toBeVisible();
      await expect(org.contactEmailInput).toBeVisible();
      await expect(org.phoneInput).toBeVisible();
      await expect(org.websiteUrlInput).toBeVisible();
      await expect(org.addressInput).toBeVisible();
      await expect(org.browseFilesButton).toBeVisible(); // logo upload control
      await expect(org.logoInput).toBeAttached();
      await expect(org.createButton).toBeVisible();
    });

    test('logo input accepts only image types', async () => {
      await expect(org.logoInput).toHaveAttribute('accept', /image\/png/);
    });
  });

  test.describe('required fields', () => {
    test('organization name is required', async ({ page }) => {
      await org.submit();

      expect(await org.fieldValidity('name')).toMatchObject({
        valid: false,
        valueMissing: true,
      });
      await expect(page).toHaveURL(CREATE_FORM);
    });
  });

  test.describe('contact email format', () => {
    for (const contactEmail of ['bademail', 'test@', 'test@a.']) {
      test(`rejects malformed contact email "${contactEmail}"`, async ({
        page,
      }) => {
        await org.fillForm({ name: 'Valid Org', contactEmail });
        await org.submit();

        expect(await org.fieldValidity('contactEmail')).toMatchObject({
          valid: false,
          typeMismatch: true,
        });
        await expect(page).toHaveURL(CREATE_FORM);
      });
    }

    test('accepts a valid contact email', async () => {
      await org.fillForm({ contactEmail: 'org@example.com' });
      expect(await org.fieldValidity('contactEmail')).toMatchObject({
        valid: true,
      });
    });
  });

  test.describe('website format', () => {
    for (const websiteUrl of ['notaurl', 'example.com']) {
      test(`rejects malformed website "${websiteUrl}"`, async ({ page }) => {
        await org.fillForm({ name: 'Valid Org', websiteUrl });
        await org.submit();

        expect(await org.fieldValidity('websiteUrl')).toMatchObject({
          valid: false,
          typeMismatch: true,
        });
        await expect(page).toHaveURL(CREATE_FORM);
      });
    }

    test('accepts a valid website URL', async () => {
      await org.fillForm({ websiteUrl: 'https://example.org' });
      expect(await org.fieldValidity('websiteUrl')).toMatchObject({
        valid: true,
      });
    });
  });

  test.describe('phone', () => {
    test('does not enforce a phone number format (tel input)', async () => {
      await org.fillForm({ phone: 'not a real number 123' });
      expect(await org.fieldValidity('phone')).toMatchObject({ valid: true });
    });
  });

  test.describe('logo upload', () => {
    test('accepts a valid image (no type error)', async () => {
      await org.uploadLogo({
        name: 'logo.png',
        mimeType: 'image/png',
        buffer: PNG_1x1,
      });
      await expect(org.logoTypeError).toHaveCount(0);
    });

    test('rejects a non-image file with a clear message', async () => {
      await org.uploadLogo({
        name: 'note.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('hello'),
      });
      await expect(org.logoTypeError).toBeVisible();
    });
  });

  test.describe('submit button state', () => {
    test('create button is enabled even when the form is empty', async () => {
      await expect(org.createButton).toBeEnabled();
    });
  });

  test.describe('input handling', () => {
    test('whitespace-only name is not blocked client-side (no trim on text field)', async () => {
      await org.fillForm({ name: '   ' });
      expect(await org.fieldValidity('name')).toMatchObject({ valid: true });
    });

    test('contact email trims surrounding whitespace (type=email)', async () => {
      await org.fillForm({ contactEmail: '  org@example.com  ' });
      expect(await org.fieldValidity('contactEmail')).toMatchObject({
        valid: true,
      });
    });

    test('does not enforce a maximum name length', async () => {
      await org.fillForm({ name: 'a'.repeat(300) });
      expect(await org.fieldValidity('name')).toMatchObject({ valid: true });
    });
  });

  test.describe('keyboard', () => {
    test('pressing Enter with an empty name is blocked by required validation', async ({
      page,
    }) => {
      await org.nameInput.click();
      await page.keyboard.press('Enter');

      expect(await org.fieldValidity('name')).toMatchObject({
        valid: false,
        valueMissing: true,
      });
      await expect(page).toHaveURL(CREATE_FORM);
    });
  });

  test.describe('form reset', () => {
    test('form does not persist values after a page reload', async () => {
      await org.fillForm({ name: 'Draft Org', description: 'temp' });
      await org.gotoCreate();

      await expect(org.nameInput).toHaveValue('');
      await expect(org.descriptionInput).toHaveValue('');
    });
  });
});
