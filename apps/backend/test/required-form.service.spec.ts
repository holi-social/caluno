import 'reflect-metadata';
import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import {
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
import {
  createFormSubmission,
  createMembershipRequest,
  createRequirementForm,
  createUser,
  setRequiredForms,
} from './factories';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
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
        unit.id,
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
          unit.id,
          form.id,
          { values: [] },
          user.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
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
    it('throws when a required form is not submitted', async () => {
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

      await expect(
        membershipService.approveMembershipRequest(
          membershipRequest.id,
          unit.id,
          reviewer.id,
        ),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
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
  });
});
