import { expect, test } from '@playwright/test';
import { OrgPage } from '../pages/org/OrgPage';
import { FormBuilderPage } from '../pages/requirement-forms/FormBuilderPage';
import { RequirementFormsPage } from '../pages/requirement-forms/RequirementFormsPage';
import { signUpAndLogin } from '../utils/session';

test.describe('requirement form builder', () => {
  let forms: RequirementFormsPage;
  let builder: FormBuilderPage;

  test.beforeEach(async ({ page }) => {
    await signUpAndLogin(page);
    const org = new OrgPage(page);
    await org.gotoCreate();
    const orgUId = await org.createOrganization(`E2E Org ${Date.now()}`);

    forms = new RequirementFormsPage(page);
    builder = new FormBuilderPage(page);
    await forms.goto(orgUId);
    await forms.createForm(`E2E Form ${Date.now()}`);
  });

  test('empty state -> add block -> save -> persists', async ({ page }) => {
    const blockTitle = `E2E Block ${Date.now()}`;

    await test.step('empty state with disabled save', async () => {
      await builder.expectEmptyState();
    });

    await test.step('add block via sheet', async () => {
      await builder.openAddBlockDialog();
      await builder.createBlockViaSheet(blockTitle);
      await expect(builder.previewBlockHeading(blockTitle)).toBeVisible();
    });

    await test.step('save and verify persistence after reload', async () => {
      await builder.saveForm();
      await page.reload();
      await expect(builder.blockHeading(blockTitle)).toBeVisible({
        timeout: 20000,
      });
      await expect(builder.previewBlockHeading(blockTitle)).toBeVisible();
    });
  });

  test('cancel navigates back to the forms list', async () => {
    await builder.expectEmptyState();
    await builder.cancel();
    await forms.expectOnList();
  });
});
