import 'reflect-metadata';
import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { ForbiddenGraphQLError } from '../src/graphql/errors';
import { RequiredFormTargetType } from '../src/requirement-profile/enums';
import { FormSubmissionService } from '../src/requirement-profile/services/form-submission.service';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { UserProfileService } from '../src/requirement-profile/services/user-profile.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import {
  createFormSubmission,
  createRequirementForm,
  createUser,
  setEventRequiredForms,
  setRequiredForms,
} from './factories';
import { createEvent } from './factories/event.factory';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createShift } from './factories/shift.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('FormSubmissionService org-unit shares', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let formSubmissionService: FormSubmissionService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    const postHogService = { capture: () => {} } as unknown as PostHogService;
    const requiredFormService = new RequiredFormService(db, postHogService);
    formSubmissionService = new FormSubmissionService(
      db,
      new UserProfileService(db, postHogService),
      requiredFormService,
      postHogService,
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  const setupOrgWithUnits = async () => {
    const admin = await createUser(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `Form Submission Org ${crypto.randomUUID()}`,
    );
    const rootUnit = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    const unitA = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'unit-a',
      parentId: rootUnit.id,
    });
    const unitB = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'unit-b',
      parentId: rootUnit.id,
    });
    const volunteer = await createUser(db);
    return { admin, organization, rootUnit, unitA, unitB, volunteer };
  };

  const sharesFor = (submissionId: string, organizationUnitId?: string) =>
    organizationUnitId
      ? db.query.formSubmissionShares.findMany({
          where: { submissionId, organizationUnitId },
        })
      : db.query.formSubmissionShares.findMany({
          where: { submissionId },
        });

  describe('findByUserAndOrgUnit', () => {
    it('returns a submission shared with the unit', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      // Form owned by the root unit, not required anywhere — visibility
      // comes from the share row alone.
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      const submission = await createFormSubmission(db, {
        formId: form.id,
        userId: volunteer.id,
      });
      await db.insert(schema.formSubmissionShares).values({
        submissionId: submission.id,
        organizationUnitId: unitA.id,
      });

      const submissions = await formSubmissionService.findByUserAndOrgUnit(
        volunteer.id,
        unitA.id,
      );

      expect(submissions.map((s) => s.id)).toEqual([submission.id]);
    });

    it('does not return submissions for an unrelated unit', async () => {
      const { admin, rootUnit, unitA, unitB, volunteer } =
        await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      const submission = await createFormSubmission(db, {
        formId: form.id,
        userId: volunteer.id,
      });
      await db.insert(schema.formSubmissionShares).values({
        submissionId: submission.id,
        organizationUnitId: unitA.id,
      });

      const submissions = await formSubmissionService.findByUserAndOrgUnit(
        volunteer.id,
        unitB.id,
      );

      expect(submissions).toEqual([]);
    });

    it('does not return submissions merely because the unit owns or requires the form', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unitA.id,
        formIds: [form.id],
      });
      await createFormSubmission(db, {
        formId: form.id,
        userId: volunteer.id,
      });

      const [forOwner, forRequirer] = await Promise.all([
        formSubmissionService.findByUserAndOrgUnit(volunteer.id, rootUnit.id),
        formSubmissionService.findByUserAndOrgUnit(volunteer.id, unitA.id),
      ]);

      expect(forOwner).toEqual([]);
      expect(forRequirer).toEqual([]);
    });
  });

  describe('submitRequiredForm attribution', () => {
    it('attributes an ORGANIZATION_UNIT-target submission to that unit', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unitA.id,
        formIds: [form.id],
      });

      const submission = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: unitA.id,
        },
        form.id,
        { values: [] },
        volunteer.id,
      );

      expect(submission.formId).toBe(form.id);
      expect(await sharesFor(submission.id, unitA.id)).toHaveLength(1);
      // The owning unit only sees it once shared — not by ownership alone.
      expect(
        await formSubmissionService.findByUserAndOrgUnit(
          volunteer.id,
          rootUnit.id,
        ),
      ).toEqual([]);
    });

    it('attributes an EVENT-target submission to the event’s org unit', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      const event = await createEvent(db, {
        organizationUnitId: unitA.id,
      });
      await setEventRequiredForms(db, {
        eventId: event.id,
        formIds: [form.id],
      });

      const submission = await formSubmissionService.submitRequiredForm(
        { targetType: RequiredFormTargetType.EVENT, targetId: event.id },
        form.id,
        { values: [] },
        volunteer.id,
      );

      expect(await sharesFor(submission.id, unitA.id)).toHaveLength(1);
      expect(
        await formSubmissionService.findByUserAndOrgUnit(
          volunteer.id,
          unitA.id,
        ),
      ).toHaveLength(1);
    });

    it('attributes a SHIFT_INSTANCE-target submission to the shift’s org unit', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      const shift = await createShift(db, {
        organizationUnitId: unitA.id,
      });
      const [instance] = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      expect(instance).toBeDefined();
      await db.insert(schema.shiftInstanceRequiredForms).values({
        shiftInstanceId: instance.id,
        formId: form.id,
        order: 0,
      });

      const submission = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.SHIFT_INSTANCE,
          targetId: instance.id,
        },
        form.id,
        { values: [] },
        volunteer.id,
      );

      expect(await sharesFor(submission.id, unitA.id)).toHaveLength(1);
      expect(
        await formSubmissionService.findByUserAndOrgUnit(
          volunteer.id,
          unitA.id,
        ),
      ).toHaveLength(1);
    });
  });

  describe('share-on-ask', () => {
    it('returns the existing submission and shares it with the asking unit', async () => {
      const { admin, rootUnit, unitA, unitB, volunteer } =
        await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unitA.id,
        formIds: [form.id],
      });
      const first = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: unitA.id,
        },
        form.id,
        { values: [] },
        volunteer.id,
      );

      // Unit B asks for the same form later.
      await setRequiredForms(db, {
        organizationUnitId: unitB.id,
        formIds: [form.id],
      });
      const second = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: unitB.id,
        },
        form.id,
        { values: [] },
        volunteer.id,
      );
      // Asking again never throws and never duplicates the submission.
      const third = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: unitB.id,
        },
        form.id,
        { values: [] },
        volunteer.id,
      );

      expect(second.id).toBe(first.id);
      expect(third.id).toBe(first.id);
      const rows = await db.query.formSubmissions.findMany({
        where: { userId: volunteer.id, formId: form.id },
      });
      expect(rows).toHaveLength(1);
      expect(await sharesFor(first.id, unitA.id)).toHaveLength(1);
      expect(await sharesFor(first.id, unitB.id)).toHaveLength(1);
      // Both units can see the single shared submission.
      expect(
        await formSubmissionService.findByUserAndOrgUnit(
          volunteer.id,
          unitA.id,
        ),
      ).toHaveLength(1);
      expect(
        await formSubmissionService.findByUserAndOrgUnit(
          volunteer.id,
          unitB.id,
        ),
      ).toHaveLength(1);
    });
  });

  describe('shareSubmissionsWithOrgUnit', () => {
    it('shares existing submissions for a target’s required forms with its unit', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      const event = await createEvent(db, {
        organizationUnitId: unitA.id,
      });
      await setEventRequiredForms(db, {
        eventId: event.id,
        formIds: [form.id],
      });
      const submission = await createFormSubmission(db, {
        formId: form.id,
        userId: volunteer.id,
      });

      await formSubmissionService.shareSubmissionsWithOrgUnit(volunteer.id, {
        targetType: RequiredFormTargetType.EVENT,
        targetId: event.id,
      });

      expect(await sharesFor(submission.id, unitA.id)).toHaveLength(1);
      expect(
        await formSubmissionService.findByUserAndOrgUnit(
          volunteer.id,
          unitA.id,
        ),
      ).toHaveLength(1);
    });

    it('shares for org-unit targets too', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unitA.id,
        formIds: [form.id],
      });
      const submission = await createFormSubmission(db, {
        formId: form.id,
        userId: volunteer.id,
      });

      await formSubmissionService.shareSubmissionsWithOrgUnit(volunteer.id, {
        targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
        targetId: unitA.id,
      });

      expect(await sharesFor(submission.id, unitA.id)).toHaveLength(1);
    });

    it('does nothing when the user has no submissions', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unitA.id,
        formIds: [form.id],
      });

      await formSubmissionService.shareSubmissionsWithOrgUnit(volunteer.id, {
        targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
        targetId: unitA.id,
      });

      const shares = await db.query.formSubmissionShares.findMany({
        where: { organizationUnitId: unitA.id },
      });
      expect(shares).toEqual([]);
    });
  });

  describe('submit by share token', () => {
    it('shares the submission with the unit from the link', async () => {
      const { admin, rootUnit, unitA, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });

      const submission = await formSubmissionService.submit(
        form.shareToken,
        { values: [] },
        volunteer.id,
        unitA.id,
      );

      expect(await sharesFor(submission.id, unitA.id)).toHaveLength(1);
      expect(await sharesFor(submission.id, rootUnit.id)).toHaveLength(0);
    });

    it('rejects a link unit outside the form’s organization', async () => {
      const { admin, rootUnit, volunteer } = await setupOrgWithUnits();
      const { form } = await createRequirementForm(db, {
        organizationId: rootUnit.organizationId,
        organizationUnitId: rootUnit.id,
        createdById: admin.id,
      });
      const otherOrg = await createOrganizationWithType(
        db,
        `Other Org ${crypto.randomUUID()}`,
      );
      const otherUnit = await createUnit(db, {
        organizationId: otherOrg.organization.id,
        typeId: otherOrg.type.id,
        name: 'other-unit',
      });

      await expect(
        formSubmissionService.submit(
          form.shareToken,
          { values: [] },
          volunteer.id,
          otherUnit.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
    });
  });
});
