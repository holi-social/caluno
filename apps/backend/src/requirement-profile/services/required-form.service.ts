import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import type {
  OrganizationUnitEntity,
  RequirementFormEntity,
} from '../../database/schema';
import * as schema from '../../database/schema';
import { EventInviteStatus } from '../../event/enums';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { ShiftInviteStatus } from '../../shift/enums';
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

@Injectable()
export class RequiredFormService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
  ) {}

  private async verifyFormsHaveBlocks(
    formIds: string[],
    runner: Database,
  ): Promise<void> {
    const uniqueFormIds = [...new Set(formIds)];
    if (uniqueFormIds.length === 0) {
      return;
    }

    const refs = await runner.query.requirementFormBlockRefs.findMany({
      where: { formId: { in: uniqueFormIds } },
      columns: { formId: true },
    });

    const formsWithBlocks = new Set(refs.map((ref) => ref.formId));
    if (formsWithBlocks.size !== uniqueFormIds.length) {
      throw new BadRequestGraphQLError(
        'One or more forms do not contain any blocks',
      );
    }
  }

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

        return rows.map((row) => ({
          // formId is a NOT NULL FK with onDelete: 'restrict', so row.form always exists.
          form: row.form as RequirementFormEntity,
          order: row.order,
        }));
      }
      case RequiredFormTargetType.EVENT: {
        const rows = await this.db.query.eventRequiredForms.findMany({
          where: { eventId: target.targetId },
          orderBy: { order: 'asc' },
          with: { form: true },
        });

        return rows.map((row) => ({
          form: row.form as RequirementFormEntity,
          order: row.order,
        }));
      }
      case RequiredFormTargetType.SHIFT: {
        const rows = await this.db.query.shiftRequiredForms.findMany({
          where: { shiftId: target.targetId },
          orderBy: { order: 'asc' },
          with: { form: true },
        });

        return rows.map((row) => ({
          form: row.form as RequirementFormEntity,
          order: row.order,
        }));
      }
      case RequiredFormTargetType.SHIFT_INSTANCE: {
        const rows = await this.db.query.shiftInstanceRequiredForms.findMany({
          where: { shiftInstanceId: target.targetId },
          orderBy: { order: 'asc' },
          with: { form: true },
        });

        return rows.map((row) => ({
          form: row.form as RequirementFormEntity,
          order: row.order,
        }));
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

  async requiredFormsForUser(
    userId: string,
    organizationUnitId: string,
  ): Promise<RequirementFormEntity[]> {
    // 1. requested: org-unit required forms
    const orgUnitRequired = await this.getRequiredForms({
      targetType: RequiredFormTargetType.ORGANIZATION_UNIT,
      targetId: organizationUnitId,
    });

    // 2. requested: event required forms for events the user is invited
    const pendingEventInvites = await this.db.query.eventInvites.findMany({
      where: {
        userId,
        event: { organizationUnitId },
        status: EventInviteStatus.INVITED,
      },
    });

    const eventIds = pendingEventInvites.map((e) => e.eventId);
    const eventsRequiredForms = await this.getRequiredFormsByEventIds(eventIds);

    // 3. requested: shift required forms for any shift intance the user is invited
    const shiftIdRows = await this.db
      .select({ masterId: schema.shiftInstances.masterId })
      .from(schema.shiftInstanceInvites)
      .innerJoin(
        schema.shiftInstances,
        eq(schema.shiftInstances.id, schema.shiftInstanceInvites.instanceId),
      )
      .innerJoin(
        schema.shifts,
        eq(schema.shifts.id, schema.shiftInstances.masterId),
      )
      .where(
        and(
          eq(schema.shiftInstanceInvites.userId, userId),
          eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.INVITED),
          eq(schema.shiftInstances.isCancelled, false),
          eq(schema.shifts.organizationUnitId, organizationUnitId),
          eq(schema.shifts.isDeleted, false),
        ),
      )
      .groupBy(schema.shiftInstances.masterId);
    const shiftIds = shiftIdRows.map((row) => row.masterId);
    const shiftsRequiredForms = await this.getRequiredFormsByShiftIds(shiftIds);

    // 4. union of requested forms, deduped by formId
    const byForm = new Map<string, RequirementFormEntity>();
    for (const { form } of [
      ...orgUnitRequired,
      ...eventsRequiredForms,
      ...shiftsRequiredForms,
    ]) {
      byForm.set(form.id, form);
    }

    return [...byForm.values()];
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
      case RequiredFormTargetType.SHIFT:
        return this.setRequiredFormsForShift(target.targetId, formIds);
      case RequiredFormTargetType.SHIFT_INSTANCE:
        return this.setRequiredFormsForShiftInstance(target.targetId, formIds);
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

      await this.verifyFormsHaveBlocks(formIds, this.db);
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

    await this.applyEventRequiredForms(
      eventId,
      // organizationUnitId is a NOT NULL FK, so organizationUnit always exists.
      (event.organizationUnit as OrganizationUnitEntity).organizationId,
      formIds,
    );

    return this.getRequiredForms({
      targetType: RequiredFormTargetType.EVENT,
      targetId: eventId,
    });
  }

  private async setRequiredFormsForShift(
    shiftId: string,
    formIds: string[],
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    const shift = await this.db.query.shifts.findFirst({
      where: { id: shiftId, isDeleted: false },
      with: { organizationUnit: true },
    });

    if (!shift) {
      throw new NotFoundGraphQLError('Shift not found');
    }

    await this.applyShiftRequiredForms(
      shiftId,
      // organizationUnitId is a NOT NULL FK, so organizationUnit always exists.
      (shift.organizationUnit as OrganizationUnitEntity).organizationId,
      formIds,
    );

    return this.getRequiredForms({
      targetType: RequiredFormTargetType.SHIFT,
      targetId: shiftId,
    });
  }

  private async setRequiredFormsForShiftInstance(
    shiftInstanceId: string,
    formIds: string[],
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    const instance = await this.db.query.shiftInstances.findFirst({
      where: { id: shiftInstanceId, isCancelled: false },
      with: { master: { with: { organizationUnit: true } } },
    });

    if (!instance) {
      throw new NotFoundGraphQLError('Shift instance not found');
    }

    await this.applyShiftInstanceRequiredForms(
      shiftInstanceId,
      // masterId and organizationUnitId are NOT NULL FKs, so both always exist.
      (instance.master.organizationUnit as OrganizationUnitEntity)
        .organizationId,
      formIds,
    );

    return this.getRequiredForms({
      targetType: RequiredFormTargetType.SHIFT_INSTANCE,
      targetId: shiftInstanceId,
    });
  }

  // Shared by ShiftService.updateShiftInstance (single instance edits).
  async applyShiftInstanceRequiredForms(
    shiftInstanceId: string,
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

      await this.verifyFormsHaveBlocks(formIds, runner);
    }

    const write = async (writer: Database) => {
      await writer
        .delete(schema.shiftInstanceRequiredForms)
        .where(
          eq(
            schema.shiftInstanceRequiredForms.shiftInstanceId,
            shiftInstanceId,
          ),
        );

      if (formIds.length > 0) {
        await writer.insert(schema.shiftInstanceRequiredForms).values(
          formIds.map((formId, index) => ({
            shiftInstanceId,
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

  // Shared by the standalone setShiftRequiredForms mutation (no tx: opens
  // its own) and ShiftService.create/update (pass their surrounding tx so
  // the write commits atomically with the rest of the shift mutation).
  async applyShiftRequiredForms(
    shiftId: string,
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

      await this.verifyFormsHaveBlocks(formIds, runner);
    }

    const write = async (writer: Database) => {
      await writer
        .delete(schema.shiftRequiredForms)
        .where(eq(schema.shiftRequiredForms.shiftId, shiftId));

      if (formIds.length > 0) {
        await writer.insert(schema.shiftRequiredForms).values(
          formIds.map((formId, index) => ({
            shiftId,
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

  async countRequiredFormsByShiftIds(
    shiftIds: string[],
  ): Promise<Array<{ shiftId: string; count: number }>> {
    if (shiftIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        shiftId: schema.shiftRequiredForms.shiftId,
        count: count(),
      })
      .from(schema.shiftRequiredForms)
      .where(inArray(schema.shiftRequiredForms.shiftId, shiftIds))
      .groupBy(schema.shiftRequiredForms.shiftId);

    return rows.map((row) => ({
      shiftId: row.shiftId,
      count: Number(row.count),
    }));
  }

  async getRequiredFormsByShiftIds(shiftIds: string[]): Promise<
    Array<{
      shiftId: string;
      form: RequirementFormEntity;
      order: number;
    }>
  > {
    if (shiftIds.length === 0) {
      return [];
    }

    const rows = await this.db.query.shiftRequiredForms.findMany({
      where: { shiftId: { in: shiftIds } },
      orderBy: { order: 'asc' },
      with: { form: true },
    });

    return rows
      .map((row) => ({
        shiftId: row.shiftId,
        form: row.form,
        order: row.order,
      }))
      .filter(
        (
          row,
        ): row is {
          shiftId: string;
          form: RequirementFormEntity;
          order: number;
        } => Boolean(row.form),
      );
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

      await this.verifyFormsHaveBlocks(formIds, runner);
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

  async countRequiredFormsByShiftInstanceIds(
    shiftInstanceIds: string[],
  ): Promise<Array<{ shiftInstanceId: string; count: number }>> {
    if (shiftInstanceIds.length === 0) {
      return [];
    }

    const rows = await this.db
      .select({
        shiftInstanceId: schema.shiftInstanceRequiredForms.shiftInstanceId,
        count: count(),
      })
      .from(schema.shiftInstanceRequiredForms)
      .where(
        inArray(
          schema.shiftInstanceRequiredForms.shiftInstanceId,
          shiftInstanceIds,
        ),
      )
      .groupBy(schema.shiftInstanceRequiredForms.shiftInstanceId);

    return rows.map((row) => ({
      shiftInstanceId: row.shiftInstanceId,
      count: Number(row.count),
    }));
  }

  async getRequiredFormsByShiftInstanceIds(shiftInstanceIds: string[]): Promise<
    Array<{
      shiftInstanceId: string;
      form: RequirementFormEntity;
      order: number;
    }>
  > {
    if (shiftInstanceIds.length === 0) {
      return [];
    }

    const rows = await this.db.query.shiftInstanceRequiredForms.findMany({
      where: { shiftInstanceId: { in: shiftInstanceIds } },
      orderBy: { order: 'asc' },
      with: { form: true },
    });

    return rows.map((row) => ({
      shiftInstanceId: row.shiftInstanceId,
      // formId is a NOT NULL FK with onDelete: 'restrict', so row.form always exists.
      form: row.form as RequirementFormEntity,
      order: row.order,
    }));
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

    if ((eventRow?.count ?? 0) > 0) {
      return true;
    }

    const [shiftRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.shiftRequiredForms)
      .where(eq(schema.shiftRequiredForms.formId, formId));

    if ((shiftRow?.count ?? 0) > 0) {
      return true;
    }

    const [shiftInstanceRow] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.shiftInstanceRequiredForms)
      .where(eq(schema.shiftInstanceRequiredForms.formId, formId));

    return (shiftInstanceRow?.count ?? 0) > 0;
  }
}
