import 'reflect-metadata';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { EventInviteOrigin } from '../src/event/enums';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../src/graphql/errors';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification/notification.service';
import { RequiredFormTargetType } from '../src/requirement-profile/enums';
import { FormSubmissionService } from '../src/requirement-profile/services/form-submission.service';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementFormService } from '../src/requirement-profile/services/requirement-form.service';
import { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import { UserProfileService } from '../src/requirement-profile/services/user-profile.service';
import { JoinStatus } from '../src/shared/enums/join-status.enum';
import { PostHogCaptureService } from '../src/shared/observability/posthog.capture.service';
import { ShiftInviteOrigin, ShiftInviteStatus } from '../src/shift/enums';
import {
  cancelShiftInstance,
  createFormSubmission,
  createMembershipRequest,
  createRequirementForm,
  createShiftInstance,
  createUser,
  setEventRequiredForms,
  setRequiredForms,
  setShiftRequiredForms,
} from './factories';
import { createEvent } from './factories/event.factory';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createShift } from './factories/shift.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

const createDefaultMemberRole = async (
  db: Database,
  organizationId: string,
) => {
  const [role] = await db
    .insert(schema.roles)
    .values({
      organizationId,
      name: 'Member',
      isInternal: true,
    })
    .returning();
  if (!role) throw new Error('Failed to create default member role');
  return role;
};

describe('RequiredFormService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let requiredFormService: RequiredFormService;
  let formSubmissionService: FormSubmissionService;
  let membershipService: MembershipService;
  let requirementFormService: RequirementFormService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    requiredFormService = new RequiredFormService(db);
    const userProfileService = new UserProfileService(db);
    formSubmissionService = new FormSubmissionService(
      db,
      userProfileService,
      requiredFormService,
    );
    requirementFormService = new RequirementFormService(
      db,
      requiredFormService,
    );

    const authServiceMock = {
      findUsersWithPermission: async () => [],
    } as unknown as AuthService;
    const notificationServiceMock = {
      notifyMembershipRequested: async () => {},
      notifyMembershipApproved: async () => {},
    } as unknown as NotificationService;

    membershipService = new MembershipService(
      db,
      {} as unknown as RequirementProfileService,
      authServiceMock,
      notificationServiceMock,
      requiredFormService,
      { captureUserJoinedOrg: () => {} } as unknown as PostHogCaptureService,
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  const setupOrg = async () => {
    const user = await createUser(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `Required Form Org ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    return { user, organization, type, unit };
  };

  const orgUnitTarget = (unitId: string) => ({
    targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
    targetId: unitId,
  });

  describe('getRequiredForms', () => {
    it('returns forms in the order they were attached', async () => {
      const { user, unit } = await setupOrg();
      const { form: formA } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form A',
      });
      const { form: formB } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form B',
      });

      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [formB.id, formA.id],
      });

      const requiredForms = await requiredFormService.getRequiredForms(
        orgUnitTarget(unit.id),
      );

      expect(requiredForms).toHaveLength(2);
      expect(requiredForms[0]?.form.id).toBe(formB.id);
      expect(requiredForms[0]?.order).toBe(0);
      expect(requiredForms[1]?.form.id).toBe(formA.id);
      expect(requiredForms[1]?.order).toBe(1);
    });

    it('returns an empty array when no forms are attached', async () => {
      const { unit } = await setupOrg();
      const requiredForms = await requiredFormService.getRequiredForms(
        orgUnitTarget(unit.id),
      );
      expect(requiredForms).toEqual([]);
    });
  });

  describe('getRequiredFormStatuses', () => {
    it('marks required forms as submitted when a SUBMITTED submission exists', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });
      const submission = await createFormSubmission(db, {
        formId: form.id,
        userId: user.id,
      });

      const statuses = await requiredFormService.getRequiredFormStatuses(
        user.id,
        orgUnitTarget(unit.id),
      );

      expect(statuses).toHaveLength(1);
      expect(statuses[0]?.submitted).toBe(true);
      expect(statuses[0]?.submissionId).toBe(submission.id);
    });

    it('marks required forms as unsubmitted when there is no submission', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      const statuses = await requiredFormService.getRequiredFormStatuses(
        user.id,
        orgUnitTarget(unit.id),
      );

      expect(statuses[0]?.submitted).toBe(false);
      expect(statuses[0]?.submissionId).toBeNull();
    });

    it('does not count REJECTED submissions as satisfied', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });
      await createFormSubmission(db, {
        formId: form.id,
        userId: user.id,
        status: 'rejected',
      });

      const statuses = await requiredFormService.getRequiredFormStatuses(
        user.id,
        orgUnitTarget(unit.id),
      );

      expect(statuses[0]?.submitted).toBe(false);
    });
  });

  describe('hasRequiredForms', () => {
    it('returns true when forms are attached', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });

      expect(
        await requiredFormService.hasRequiredForms(orgUnitTarget(unit.id)),
      ).toBe(false);

      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      expect(
        await requiredFormService.hasRequiredForms(orgUnitTarget(unit.id)),
      ).toBe(true);
    });

    it('returns false when no forms are attached', async () => {
      const { unit } = await setupOrg();

      expect(
        await requiredFormService.hasRequiredForms(orgUnitTarget(unit.id)),
      ).toBe(false);
    });
  });

  describe('countRequiredFormsByEventIds', () => {
    it('returns counts for multiple events', async () => {
      const { user, unit } = await setupOrg();
      const eventA = await createEvent(db, { organizationUnitId: unit.id });
      const eventB = await createEvent(db, { organizationUnitId: unit.id });
      const { form: formA } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      const { form: formB } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });

      await setEventRequiredForms(db, {
        eventId: eventA.id,
        formIds: [formA.id, formB.id],
      });
      await setEventRequiredForms(db, {
        eventId: eventB.id,
        formIds: [formA.id],
      });

      const counts = await requiredFormService.countRequiredFormsByEventIds([
        eventA.id,
        eventB.id,
      ]);

      const countsByEventId = new Map(
        counts.map((row) => [row.eventId, row.count]),
      );
      expect(countsByEventId.get(eventA.id)).toBe(2);
      expect(countsByEventId.get(eventB.id)).toBe(1);
    });

    it('returns zero for events with no required forms', async () => {
      const { unit } = await setupOrg();
      const event = await createEvent(db, { organizationUnitId: unit.id });

      const counts = await requiredFormService.countRequiredFormsByEventIds([
        event.id,
      ]);

      expect(counts).toEqual([]);
    });

    it('returns an empty array for empty input', async () => {
      const counts = await requiredFormService.countRequiredFormsByEventIds([]);
      expect(counts).toEqual([]);
    });
  });

  describe('countRequiredFormsByShiftIds', () => {
    it('returns counts for multiple shifts', async () => {
      const { user, unit } = await setupOrg();
      const shiftA = await createShift(db, { organizationUnitId: unit.id });
      const shiftB = await createShift(db, { organizationUnitId: unit.id });
      const { form: formA } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      const { form: formB } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });

      await setShiftRequiredForms(db, {
        shiftId: shiftA.id,
        formIds: [formA.id, formB.id],
      });
      await setShiftRequiredForms(db, {
        shiftId: shiftB.id,
        formIds: [formA.id],
      });

      const counts = await requiredFormService.countRequiredFormsByShiftIds([
        shiftA.id,
        shiftB.id,
      ]);

      const countsByShiftId = new Map(
        counts.map((row) => [row.shiftId, row.count]),
      );
      expect(countsByShiftId.get(shiftA.id)).toBe(2);
      expect(countsByShiftId.get(shiftB.id)).toBe(1);
    });

    it('returns zero for shifts with no required forms', async () => {
      const { unit } = await setupOrg();
      const shift = await createShift(db, { organizationUnitId: unit.id });

      const counts = await requiredFormService.countRequiredFormsByShiftIds([
        shift.id,
      ]);

      expect(counts).toEqual([]);
    });

    it('returns an empty array for empty input', async () => {
      const counts = await requiredFormService.countRequiredFormsByShiftIds([]);
      expect(counts).toEqual([]);
    });
  });

  describe('getRequiredFormsByShiftIds', () => {
    it('returns forms grouped by shift, ordered by attachment order', async () => {
      const { user, unit } = await setupOrg();
      const shift = await createShift(db, { organizationUnitId: unit.id });
      const { form: formA } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form A',
      });
      const { form: formB } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form B',
      });

      await setShiftRequiredForms(db, {
        shiftId: shift.id,
        formIds: [formB.id, formA.id],
      });

      const rows = await requiredFormService.getRequiredFormsByShiftIds([
        shift.id,
      ]);

      expect(rows).toHaveLength(2);
      expect(rows[0]?.form.id).toBe(formB.id);
      expect(rows[1]?.form.id).toBe(formA.id);
    });

    it('returns an empty array for empty input', async () => {
      const rows = await requiredFormService.getRequiredFormsByShiftIds([]);
      expect(rows).toEqual([]);
    });
  });

  describe('areRequiredFormsSatisfied', () => {
    it('is satisfied when no required forms are attached', async () => {
      const { user, unit } = await setupOrg();

      expect(
        await requiredFormService.areRequiredFormsSatisfied(
          user.id,
          orgUnitTarget(unit.id),
        ),
      ).toBe(true);
    });

    it('is satisfied when all forms are submitted', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });
      await createFormSubmission(db, { formId: form.id, userId: user.id });

      expect(
        await requiredFormService.areRequiredFormsSatisfied(
          user.id,
          orgUnitTarget(unit.id),
        ),
      ).toBe(true);
    });

    it('is not satisfied when a required form is missing', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      expect(
        await requiredFormService.areRequiredFormsSatisfied(
          user.id,
          orgUnitTarget(unit.id),
        ),
      ).toBe(false);
    });
  });

  describe('setRequiredForms', () => {
    it('replaces the existing required-form list', async () => {
      const { user, unit } = await setupOrg();
      const { form: formA } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form A',
      });
      const { form: formB } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form B',
      });

      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [formA.id],
      });
      const result = await requiredFormService.setRequiredForms(
        orgUnitTarget(unit.id),
        [formB.id],
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.form.id).toBe(formB.id);
      expect(
        (
          await requiredFormService.getRequiredForms(orgUnitTarget(unit.id))
        ).map((r) => r.form.id),
      ).toEqual([formB.id]);
    });

    it('throws when a form does not belong to the organization', async () => {
      const { user, unit } = await setupOrg();
      const { organization: otherOrg, type: otherType } =
        await createOrganizationWithType(
          db,
          `Other Org ${crypto.randomUUID()}`,
        );
      const otherUnit = await createUnit(db, {
        organizationId: otherOrg.id,
        typeId: otherType.id,
        name: 'root',
      });
      const { form: otherForm } = await createRequirementForm(db, {
        organizationId: otherOrg.id,
        organizationUnitId: otherUnit.id,
        createdById: user.id,
      });

      await expect(
        requiredFormService.setRequiredForms(orgUnitTarget(unit.id), [
          otherForm.id,
        ]),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });

    it('throws when the organization unit does not exist', async () => {
      await expect(
        requiredFormService.setRequiredForms(
          orgUnitTarget(crypto.randomUUID()),
          [],
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('replaces the required-form list for a shift', async () => {
      const { user, unit } = await setupOrg();
      const shift = await createShift(db, { organizationUnitId: unit.id });
      const { form: formA } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form A',
      });
      const { form: formB } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        name: 'Form B',
      });

      await setShiftRequiredForms(db, {
        shiftId: shift.id,
        formIds: [formA.id],
      });
      const result = await requiredFormService.setRequiredForms(
        { targetType: RequiredFormTargetType.SHIFT, targetId: shift.id },
        [formB.id],
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.form.id).toBe(formB.id);
    });

    it('throws when a shift form does not belong to the organization', async () => {
      const { user, unit } = await setupOrg();
      const shift = await createShift(db, { organizationUnitId: unit.id });
      const { organization: otherOrg, type: otherType } =
        await createOrganizationWithType(
          db,
          `Other Org ${crypto.randomUUID()}`,
        );
      const otherUnit = await createUnit(db, {
        organizationId: otherOrg.id,
        typeId: otherType.id,
        name: 'root',
      });
      const { form: otherForm } = await createRequirementForm(db, {
        organizationId: otherOrg.id,
        organizationUnitId: otherUnit.id,
        createdById: user.id,
      });

      await expect(
        requiredFormService.setRequiredForms(
          { targetType: RequiredFormTargetType.SHIFT, targetId: shift.id },
          [otherForm.id],
        ),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });

    it('throws when the shift does not exist', async () => {
      await expect(
        requiredFormService.setRequiredForms(
          {
            targetType: RequiredFormTargetType.SHIFT,
            targetId: crypto.randomUUID(),
          },
          [],
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });
  });

  describe('isFormRequiredByAnyTarget', () => {
    it('returns true when the form is attached to any org unit', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      expect(await requiredFormService.isFormRequiredByAnyTarget(form.id)).toBe(
        true,
      );
    });

    it('returns true when the form is attached to a shift', async () => {
      const { user, unit } = await setupOrg();
      const shift = await createShift(db, { organizationUnitId: unit.id });
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setShiftRequiredForms(db, {
        shiftId: shift.id,
        formIds: [form.id],
      });

      expect(await requiredFormService.isFormRequiredByAnyTarget(form.id)).toBe(
        true,
      );
    });

    it('returns false when the form is not attached anywhere', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });

      expect(await requiredFormService.isFormRequiredByAnyTarget(form.id)).toBe(
        false,
      );
    });
  });

  describe('FormSubmissionService.submitRequiredForm', () => {
    it('creates a submission when the form is required', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      const submission = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: unit.id,
        },
        form.id,
        { values: [] },
        user.id,
      );

      expect(submission.formId).toBe(form.id);
      expect(submission.userId).toBe(user.id);
    });

    it('rejects submission when the form is not required by the org unit', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });

      await expect(
        formSubmissionService.submitRequiredForm(
          {
            targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
            targetId: unit.id,
          },
          form.id,
          { values: [] },
          user.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
    });

    it('rejects an empty JSON-array selection for a required MULTI_CHOICE field', async () => {
      const { user, unit } = await setupOrg();
      const { form, block, field } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        required: true,
      });
      await db
        .update(schema.formBlockFields)
        .set({
          type: 'MULTI_CHOICE',
          options: [{ label: 'A', value: 'A' }],
        })
        .where(eq(schema.formBlockFields.id, field.id));
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      await expect(
        formSubmissionService.submitRequiredForm(
          {
            targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
            targetId: unit.id,
          },
          form.id,
          {
            values: [{ fieldId: field.id, blockId: block.id, value: '[]' }],
          },
          user.id,
        ),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });

    it('accepts a JSON-array selection for a required MULTI_CHOICE field', async () => {
      const { user, unit } = await setupOrg();
      const { form, block, field } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
        required: true,
      });
      await db
        .update(schema.formBlockFields)
        .set({
          type: 'MULTI_CHOICE',
          options: [{ label: 'A, B', value: 'A, B' }],
        })
        .where(eq(schema.formBlockFields.id, field.id));
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      const submission = await formSubmissionService.submitRequiredForm(
        {
          targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
          targetId: unit.id,
        },
        form.id,
        {
          values: [{ fieldId: field.id, blockId: block.id, value: '["A, B"]' }],
        },
        user.id,
      );

      expect(submission.formId).toBe(form.id);
      const stored = await db.query.formSubmissionValues.findFirst({
        where: { submissionId: submission.id, fieldId: field.id },
      });
      expect(stored?.value).toEqual(['A, B']);
    });
  });

  describe('MembershipService.requestOrgJoin', () => {
    it('returns REQUIREMENTS_NEEDED when a required form is missing', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      const result = await membershipService.requestOrgJoin(user.id, unit.id);

      expect(result.status).toBe(JoinStatus.REQUIREMENTS_NEEDED);
      expect('requiredForms' in result && result.requiredForms).toHaveLength(1);
      expect(
        'requiredForms' in result && result.requiredForms?.[0]?.submitted,
      ).toBe(false);
    });

    it('creates a PENDING request when all required forms are submitted', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });
      await createFormSubmission(db, { formId: form.id, userId: user.id });

      const result = await membershipService.requestOrgJoin(user.id, unit.id);

      expect(result.status).toBe(JoinStatus.PENDING);
      expect('membershipRequest' in result).toBe(true);
    });

    it('returns JOINED when the user is already a member', async () => {
      const { user, unit } = await setupOrg();
      await addMembership(db, user.id, unit.id);

      const result = await membershipService.requestOrgJoin(user.id, unit.id);

      expect(result.status).toBe(JoinStatus.JOINED);
    });
  });

  describe('MembershipService.approveMembershipRequest', () => {
    it('approves even when a required form is not submitted', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });
      const membershipRequest = await createMembershipRequest(db, {
        userId: user.id,
        organizationUnitId: unit.id,
      });

      // Create a reviewer user with a membership so the role assignment step works
      const reviewer = await createUser(db);
      await addMembership(db, reviewer.id, unit.id);
      await createDefaultMemberRole(db, unit.organizationId);

      const approved = await membershipService.approveMembershipRequest(
        membershipRequest.id,
        unit.id,
        reviewer.id,
      );

      expect(approved.status).toBe('ACCEPTED');
    });

    it('approves when all required forms are submitted', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });
      await createFormSubmission(db, { formId: form.id, userId: user.id });
      const request = await membershipService.requestOrgJoin(user.id, unit.id);
      expect(request.status).toBe(JoinStatus.PENDING);

      const reviewer = await createUser(db);
      await addMembership(db, reviewer.id, unit.id);
      await createDefaultMemberRole(db, unit.organizationId);

      const approved = await membershipService.approveMembershipRequest(
        'membershipRequest' in request && request.membershipRequest
          ? request.membershipRequest.id
          : '',
        unit.id,
        reviewer.id,
      );

      expect(approved.status).toBe('ACCEPTED');
    });
  });

  describe('RequirementFormService.delete', () => {
    it('rejects deletion when the form is required by an org unit', async () => {
      const { user, unit } = await setupOrg();
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setRequiredForms(db, {
        organizationUnitId: unit.id,
        formIds: [form.id],
      });

      await expect(
        requirementFormService.delete(form.id, unit.id),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });

    it('rejects deletion when the form is required by a shift', async () => {
      const { user, unit } = await setupOrg();
      const shift = await createShift(db, { organizationUnitId: unit.id });
      const { form } = await createRequirementForm(db, {
        organizationId: unit.organizationId,
        organizationUnitId: unit.id,
        createdById: user.id,
      });
      await setShiftRequiredForms(db, {
        shiftId: shift.id,
        formIds: [form.id],
      });

      await expect(
        requirementFormService.delete(form.id, unit.id),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });
  });

  describe('RequiredFormService.formsForUser', () => {
    let moduleRef: TestingModule;
    let db: Database;
    let service: RequiredFormService;

    beforeAll(async () => {
      await ensureTestDatabase();
      moduleRef = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
      }).compile();
      db = moduleRef.get<Database>(DATABASE_CONNECTION);
      service = new RequiredFormService(db);

      registerTestResourceCleanup(async () => {
        await moduleRef.close();
      });
    });

    // Per-test seeded ids, cleaned up in afterEach.
    let orgId: string;
    let orgUnitId: string;
    let userId: string;
    let requiredFormId: string;
    let submittedFormId: string;
    let eventId: string;
    let eventFormId: string;
    let seededEventInviteIds: string[] = [];
    let seededSubmissionIds: string[] = [];
    let shiftId: string;
    let shiftInstanceId: string;
    let shiftFormId: string;
    let seededShiftInstanceInviteIds: string[] = [];

    const seedWorld = async () => {
      const user = await createUser(db);
      userId = user.id;

      const { organization, type } = await createOrganizationWithType(
        db,
        `Drill-in Org ${crypto.randomUUID()}`,
      );
      orgId = organization.id;

      const unit = await createUnit(db, {
        organizationId: orgId,
        typeId: type.id,
        name: 'drill-in-unit',
      });
      orgUnitId = unit.id;

      const { form: requiredForm } = await createRequirementForm(db, {
        organizationId: orgId,
        organizationUnitId: orgUnitId,
        createdById: userId,
        name: 'Required Form',
      });
      requiredFormId = requiredForm.id;

      const { form: submittedForm } = await createRequirementForm(db, {
        organizationId: orgId,
        organizationUnitId: orgUnitId,
        createdById: userId,
        name: 'Submitted Form',
      });
      submittedFormId = submittedForm.id;

      const { form: eventForm } = await createRequirementForm(db, {
        organizationId: orgId,
        organizationUnitId: orgUnitId,
        createdById: userId,
        name: 'Event Form',
      });
      eventFormId = eventForm.id;

      // org-unit required form
      await setRequiredForms(db, {
        organizationUnitId: orgUnitId,
        formIds: [requiredFormId],
      });

      // event + event-required form + invite for the user
      const event = await createEvent(db, {
        organizationUnitId: orgUnitId,
        createdById: userId,
      });
      eventId = event.id;
      await setEventRequiredForms(db, {
        eventId,
        formIds: [eventFormId],
      });
      const [invite] = await db
        .insert(schema.eventInvites)
        .values({
          eventId,
          userId,
          origin: EventInviteOrigin.ADMIN_INVITED,
          status: null,
        })
        .returning();
      if (invite) seededEventInviteIds.push(invite.id);

      // shift + shift-instance invite + shift-required form
      const { form: shiftForm } = await createRequirementForm(db, {
        organizationId: orgId,
        organizationUnitId: orgUnitId,
        createdById: userId,
        name: 'Shift Form',
      });
      shiftFormId = shiftForm.id;

      const shift = await createShift(db, {
        organizationUnitId: orgUnitId,
        createdById: userId,
      });
      shiftId = shift.id;

      const instances = await db.query.shiftInstances.findMany({
        where: { masterId: shift.id },
      });
      const shiftInstance = instances[0];
      if (!shiftInstance) {
        throw new Error('seed shift produced no instances');
      }
      shiftInstanceId = shiftInstance.id;

      const [shiftInvite] = await db
        .insert(schema.shiftInstanceInvites)
        .values({
          instanceId: shiftInstance.id,
          userId,
          origin: ShiftInviteOrigin.ADMIN_INVITED,
          status: null,
        })
        .returning();
      if (shiftInvite) seededShiftInstanceInviteIds.push(shiftInvite.id);

      await setShiftRequiredForms(db, {
        shiftId: shift.id,
        formIds: [shiftFormId],
      });

      // one submitted (non-required) form
      const submission = await createFormSubmission(db, {
        formId: submittedFormId,
        userId,
      });
      seededSubmissionIds.push(submission.id);
    };

    const cleanup = async () => {
      await db
        .delete(schema.formSubmissions)
        .where(eq(schema.formSubmissions.userId, userId));
      for (const inviteId of seededEventInviteIds) {
        await db
          .delete(schema.eventInvites)
          .where(eq(schema.eventInvites.id, inviteId));
      }
      seededEventInviteIds = [];
      seededSubmissionIds = [];
      if (eventId) {
        await db
          .delete(schema.eventRequiredForms)
          .where(eq(schema.eventRequiredForms.eventId, eventId));
        await db.delete(schema.events).where(eq(schema.events.id, eventId));
      }
      for (const inviteId of seededShiftInstanceInviteIds) {
        await db
          .delete(schema.shiftInstanceInvites)
          .where(eq(schema.shiftInstanceInvites.id, inviteId));
      }
      seededShiftInstanceInviteIds = [];
      if (shiftId) {
        await db
          .delete(schema.shiftRequiredForms)
          .where(eq(schema.shiftRequiredForms.shiftId, shiftId));
        // deleting the shift cascades to its instances and their invites
        await db.delete(schema.shifts).where(eq(schema.shifts.id, shiftId));
      }
      if (orgUnitId) {
        await db
          .delete(schema.organizationUnitRequiredForms)
          .where(
            eq(
              schema.organizationUnitRequiredForms.organizationUnitId,
              orgUnitId,
            ),
          );
      }
      for (const formId of [
        requiredFormId,
        submittedFormId,
        eventFormId,
        shiftFormId,
      ]) {
        if (formId) {
          await db
            .delete(schema.requirementForms)
            .where(eq(schema.requirementForms.id, formId));
        }
      }
      if (orgUnitId) {
        await db
          .delete(schema.organizationUnits)
          .where(eq(schema.organizationUnits.id, orgUnitId));
      }
      if (orgId) {
        await db
          .delete(schema.organizationUnitTypes)
          .where(eq(schema.organizationUnitTypes.organizationId, orgId));
        await db
          .delete(schema.organizations)
          .where(eq(schema.organizations.id, orgId));
      }
      if (userId) {
        await db.delete(schema.users).where(eq(schema.users.id, userId));
      }
      orgId = '';
      orgUnitId = '';
      userId = '';
      requiredFormId = '';
      submittedFormId = '';
      eventId = '';
      eventFormId = '';
      shiftId = '';
      shiftInstanceId = '';
      shiftFormId = '';
    };

    beforeEach(async () => {
      await seedWorld();
    });

    afterEach(async () => {
      await cleanup();
    });

    it('returns org-unit required forms (membership requested)', async () => {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const form = forms.find((f) => f.id === requiredFormId);
      expect(form).toBeDefined();
    });

    it('returns event-required forms (user invited)', async () => {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const form = forms.find((f) => f.id === eventFormId);
      expect(form).toBeDefined();
    });

    it('returns shift-required forms (user invited to a shift instance)', async () => {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const form = forms.find((f) => f.id === shiftFormId);
      expect(form).toBeDefined();
    });

    it('returns the shift form once even when multiple instances invite the user', async () => {
      // a second instance on the same shift, also inviting the user;
      // afterEach drops the shift, cascading to both instances and invites
      const secondInstance = await createShiftInstance(db, shiftId);
      await db.insert(schema.shiftInstanceInvites).values({
        instanceId: secondInstance.id,
        userId,
        origin: ShiftInviteOrigin.ADMIN_INVITED,
        status: null,
      });

      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const matches = forms.filter((f) => f.id === shiftFormId);
      expect(matches).toHaveLength(1);
    });

    it('excludes the shift form when the invited instance is cancelled', async () => {
      await cancelShiftInstance(db, shiftInstanceId);
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      expect(forms.find((f) => f.id === shiftFormId)).toBeUndefined();
    });

    it('excludes the shift form when the instance invite is not pending', async () => {
      await db
        .update(schema.shiftInstanceInvites)
        .set({
          origin: ShiftInviteOrigin.ADMIN_INVITED,
          status: ShiftInviteStatus.VOLUNTEER_ACCEPTED,
        })
        .where(eq(schema.shiftInstanceInvites.instanceId, shiftInstanceId));
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      expect(forms.find((f) => f.id === shiftFormId)).toBeUndefined();
    });
  });
});
