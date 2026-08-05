import { Inject, Injectable } from '@nestjs/common';
import { count, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import type { RequirementFormEntity } from '../../database/schema';
import * as schema from '../../database/schema';
import {
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { FormSubmissionStatus, RequiredFormTargetType } from '../enums';

export type RequiredFormTarget = {
  targetType: RequiredFormTargetType;
  targetId: string;
};

export type RequiredFormStatus = {
  form: RequirementFormEntity;
  order: number;
  submitted: boolean;
  submissionId: string | null;
  targetType: RequiredFormTargetType;
  targetId: string;
};

export type MyOrgUnitFormItem = {
  form: RequirementFormEntity;
  completed: boolean;
  submissionId: string | null;
  submittedAt: Date | null;
};

@Injectable()
export class RequiredFormService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  async getRequiredForms(
    target: RequiredFormTarget,
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    switch (target.targetType) {
      case RequiredFormTargetType.ORGANIZATION_UNIT: {
        const rows = await this.db.query.organizationUnitRequiredForms.findMany(
          {
            where: { organizationUnitId: target.targetId },
            orderBy: { order: 'asc' },
            with: { form: true },
          },
        );

        return rows
          .map((row) => ({
            form: row.form,
            order: row.order,
          }))
          .filter(
            (row): row is { form: RequirementFormEntity; order: number } =>
              Boolean(row.form),
          );
      }
      case RequiredFormTargetType.EVENT: {
        const rows = await this.db.query.eventRequiredForms.findMany({
          where: { eventId: target.targetId },
          orderBy: { order: 'asc' },
          with: { form: true },
        });

        return rows
          .map((row) => ({
            form: row.form,
            order: row.order,
          }))
          .filter(
            (row): row is { form: RequirementFormEntity; order: number } =>
              Boolean(row.form),
          );
      }
      default:
        throw new ConflictGraphQLError(
          `Unsupported required-form target: ${target.targetType}`,
        );
    }
  }

  async getRequiredFormStatuses(
    userId: string,
    target: RequiredFormTarget,
  ): Promise<RequiredFormStatus[]> {
    const requiredForms = await this.getRequiredForms(target);

    if (requiredForms.length === 0) {
      return [];
    }

    const formIds = requiredForms.map((item) => item.form.id);

    const submissions = await this.db.query.formSubmissions.findMany({
      where: {
        userId,
        status: FormSubmissionStatus.SUBMITTED,
        formId: { in: formIds },
      },
    });

    const submissionByFormId = new Map(submissions.map((s) => [s.formId, s]));

    return requiredForms.map(({ form, order }) => {
      const submission = submissionByFormId.get(form.id);
      return {
        form,
        order,
        submitted: Boolean(submission),
        submissionId: submission?.id ?? null,
        targetType: target.targetType,
        targetId: target.targetId,
      };
    });
  }

  /**
   * Computes the union of forms a user has been asked to fill in or has
   * submitted within an organization unit's organization:
   *   1. forms required at the org-unit level,
   *   2. forms required by events the user is invited to in this org,
   *   3. the user's SUBMITTED forms for this org.
   * Deduped by formId; an entry is `completed` when a SUBMITTED submission
   * exists for it. Not-completed entries sort first.
   */
  async formsForUser(
    userId: string,
    organizationUnitId: string,
  ): Promise<MyOrgUnitFormItem[]> {
    // 1. resolve the org-unit's organization
    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { organizationId: true },
    });
    if (!orgUnit) return [];
    const organizationId = orgUnit.organizationId;

    // 2. requested: org-unit required forms
    const orgUnitRequired = await this.getRequiredForms({
      targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
      targetId: organizationUnitId,
    });

    // 3. requested: event required forms for events the user is invited to
    //    within this org-unit's organization.
    const invites = await this.db.query.eventInvites.findMany({
      where: { userId },
      with: {
        event: {
          with: { organizationUnit: { columns: { organizationId: true } } },
        },
      },
    });
    const inOrgEventIds = invites
      .filter(
        (invite) =>
          invite.event?.organizationUnit?.organizationId === organizationId,
      )
      .map((invite) => invite.eventId);
    const eventRequired: Array<{ form: RequirementFormEntity; order: number }> =
      [];
    for (const eventId of new Set(inOrgEventIds)) {
      const forms = await this.getRequiredForms({
        targetType: RequiredFormTargetType.EVENT,
        targetId: eventId,
      });
      eventRequired.push(...forms);
    }

    // 4. union of requested forms, deduped by formId
    const byForm = new Map<string, MyOrgUnitFormItem>();
    for (const { form } of [...orgUnitRequired, ...eventRequired]) {
      if (!byForm.has(form.id)) {
        byForm.set(form.id, {
          form,
          completed: false,
          submissionId: null,
          submittedAt: null,
        });
      }
    }

    // 5. completed: user's submitted forms for this org. Either upgrades an
    //    existing required entry to completed, or adds a submitted-but-not-
    //    currently-required entry.
    const submissions = await this.db.query.formSubmissions.findMany({
      where: { userId, status: FormSubmissionStatus.SUBMITTED },
      with: { form: true },
    });
    for (const submission of submissions) {
      const form = submission.form;
      if (!form || form.organizationId !== organizationId) continue;
      byForm.set(form.id, {
        form,
        completed: true,
        submissionId: submission.id,
        submittedAt: submission.submittedAt,
      });
    }

    // 6. not-completed first, then completed
    const items = [...byForm.values()];
    return items.sort((a, b) => Number(a.completed) - Number(b.completed));
  }

  async countRequiredFormsByEventIds(
    eventIds: string[],
  ): Promise<Array<{ eventId: string; count: number }>> {
    if (eventIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        eventId: schema.eventRequiredForms.eventId,
        count: count(),
      })
      .from(schema.eventRequiredForms)
      .where(inArray(schema.eventRequiredForms.eventId, eventIds))
      .groupBy(schema.eventRequiredForms.eventId);

    return rows.map((row) => ({
      eventId: row.eventId,
      count: Number(row.count),
    }));
  }

  async getRequiredFormsByEventIds(eventIds: string[]): Promise<
    Array<{
      eventId: string;
      form: RequirementFormEntity;
      order: number;
    }>
  > {
    if (eventIds.length === 0) {
      return [];
    }

    const rows = await this.db.query.eventRequiredForms.findMany({
      where: { eventId: { in: eventIds } },
      orderBy: { order: 'asc' },
      with: { form: true },
    });

    return rows
      .map((row) => ({
        eventId: row.eventId,
        form: row.form,
        order: row.order,
      }))
      .filter(
        (
          row,
        ): row is {
          eventId: string;
          form: RequirementFormEntity;
          order: number;
        } => Boolean(row.form),
      );
  }

  async hasRequiredForms(target: RequiredFormTarget): Promise<boolean> {
    const requiredForms = await this.getRequiredForms(target);
    return requiredForms.length > 0;
  }

  async areRequiredFormsSatisfied(
    userId: string,
    target: RequiredFormTarget,
  ): Promise<boolean> {
    const statuses = await this.getRequiredFormStatuses(userId, target);

    if (statuses.length === 0) {
      return true;
    }

    return statuses.every((s) => s.submitted);
  }

  async setRequiredForms(
    target: RequiredFormTarget,
    formIds: string[],
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    switch (target.targetType) {
      case RequiredFormTargetType.ORGANIZATION_UNIT:
        return this.setRequiredFormsForOrganizationUnit(
          target.targetId,
          formIds,
        );
      case RequiredFormTargetType.EVENT:
        return this.setRequiredFormsForEvent(target.targetId, formIds);
      default:
        throw new ConflictGraphQLError(
          `Unsupported required-form target: ${target.targetType}`,
        );
    }
  }

  private async setRequiredFormsForOrganizationUnit(
    organizationUnitId: string,
    formIds: string[],
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });

    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    if (formIds.length > 0) {
      const forms = await this.db.query.requirementForms.findMany({
        where: {
          id: { in: formIds },
          organizationId: orgUnit.organizationId,
        },
      });

      if (forms.length !== formIds.length) {
        throw new ConflictGraphQLError(
          'One or more forms do not belong to this organization',
        );
      }
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(schema.organizationUnitRequiredForms)
        .where(
          eq(
            schema.organizationUnitRequiredForms.organizationUnitId,
            organizationUnitId,
          ),
        );

      if (formIds.length > 0) {
        await tx.insert(schema.organizationUnitRequiredForms).values(
          formIds.map((formId, index) => ({
            organizationUnitId,
            formId,
            order: index,
          })),
        );
      }
    });

    return this.getRequiredForms({
      targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
      targetId: organizationUnitId,
    });
  }

  private async setRequiredFormsForEvent(
    eventId: string,
    formIds: string[],
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    const event = await this.db.query.events.findFirst({
      where: { id: eventId, isDeleted: false },
      with: { organizationUnit: true },
    });

    if (!event) {
      throw new NotFoundGraphQLError('Event not found');
    }

    if (!event.organizationUnit) {
      throw new ConflictGraphQLError(
        'Event is not linked to an organization unit',
      );
    }

    await this.applyEventRequiredForms(
      eventId,
      event.organizationUnit.organizationId,
      formIds,
    );

    return this.getRequiredForms({
      targetType: RequiredFormTargetType.EVENT,
      targetId: eventId,
    });
  }

  // Shared by the standalone setEventRequiredForms mutation (no tx: opens
  // its own) and EventService.create/update (pass their surrounding tx so
  // the write commits atomically with the rest of the event mutation).
  async applyEventRequiredForms(
    eventId: string,
    organizationId: string,
    formIds: string[],
    tx?: Database,
  ): Promise<void> {
    const runner = tx ?? this.db;

    if (formIds.length > 0) {
      const forms = await runner.query.requirementForms.findMany({
        where: { id: { in: formIds }, organizationId },
      });

      if (forms.length !== formIds.length) {
        throw new ConflictGraphQLError(
          'One or more forms do not belong to this organization',
        );
      }
    }

    const write = async (writer: Database) => {
      await writer
        .delete(schema.eventRequiredForms)
        .where(eq(schema.eventRequiredForms.eventId, eventId));

      if (formIds.length > 0) {
        await writer.insert(schema.eventRequiredForms).values(
          formIds.map((formId, index) => ({
            eventId,
            formId,
            order: index,
          })),
        );
      }
    };

    if (tx) {
      await write(tx);
    } else {
      await this.db.transaction((innerTx) => write(innerTx));
    }
  }

  async isFormRequiredByAnyTarget(formId: string): Promise<boolean> {
    const [orgUnitRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.organizationUnitRequiredForms)
      .where(eq(schema.organizationUnitRequiredForms.formId, formId));

    if ((orgUnitRow?.count ?? 0) > 0) {
      return true;
    }

    const [eventRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.eventRequiredForms)
      .where(eq(schema.eventRequiredForms.formId, formId));

    return (eventRow?.count ?? 0) > 0;
  }
}
