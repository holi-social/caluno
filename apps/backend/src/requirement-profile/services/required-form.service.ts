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
      };
    });
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

    if (formIds.length > 0) {
      const forms = await this.db.query.requirementForms.findMany({
        where: {
          id: { in: formIds },
          organizationId: event.organizationUnit.organizationId,
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
        .delete(schema.eventRequiredForms)
        .where(eq(schema.eventRequiredForms.eventId, eventId));

      if (formIds.length > 0) {
        await tx.insert(schema.eventRequiredForms).values(
          formIds.map((formId, index) => ({
            eventId,
            formId,
            order: index,
          })),
        );
      }
    });

    return this.getRequiredForms({
      targetType: RequiredFormTargetType.EVENT,
      targetId: eventId,
    });
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
