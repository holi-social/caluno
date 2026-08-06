import 'reflect-metadata';
import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { EventInviteStatus } from '../src/event/enums';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
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
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

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

  const seedWorld = async (overrides?: {
    alsoSubmitRequiredForm?: boolean;
  }) => {
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
        status: EventInviteStatus.INVITED,
      })
      .returning();
    if (invite) seededEventInviteIds.push(invite.id);

    // one submitted form (independent of the required form unless requested)
    const submissionTargetId = overrides?.alsoSubmitRequiredForm
      ? requiredFormId
      : submittedFormId;
    const submission = await createFormSubmission(db, {
      formId: submissionTargetId,
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
    for (const formId of [requiredFormId, submittedFormId, eventFormId]) {
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
  };

  it('returns org-unit required form as not-completed', async () => {
    await seedWorld();
    try {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const f = forms.find((x) => x.form.id === requiredFormId);
      expect(f).toBeDefined();
      expect(f?.completed).toBe(false);
      expect(f?.submissionId).toBeNull();
    } finally {
      await cleanup();
    }
  });

  it('returns event-required form (user invited) as not-completed', async () => {
    await seedWorld();
    try {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const f = forms.find((x) => x.form.id === eventFormId);
      expect(f).toBeDefined();
      expect(f?.completed).toBe(false);
    } finally {
      await cleanup();
    }
  });

  it('excludes forms that are only submitted (not required)', async () => {
    await seedWorld();
    try {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const f = forms.find((x) => x.form.id === submittedFormId);
      expect(f).toBeUndefined();
    } finally {
      await cleanup();
    }
  });

  it('does not mark a required form as completed even when it has been submitted', async () => {
    await seedWorld({ alsoSubmitRequiredForm: true });
    try {
      const forms = await service.requiredFormsForUser(userId, orgUnitId);
      const matches = forms.filter((x) => x.form.id === requiredFormId);
      expect(matches).toHaveLength(1);
      expect(matches[0]?.completed).toBe(false);
      expect(matches[0]?.submissionId).toBeNull();
      expect(matches[0]?.submittedAt).toBeNull();
    } finally {
      await cleanup();
    }
  });
});
