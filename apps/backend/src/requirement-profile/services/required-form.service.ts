import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import type {
  OrganizationUnitEntity,
  RequirementFormEntity,
} from '../../database/schema';
import * as schema from '../../database/schema';
import {
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { FormSubmissionStatus } from '../enums';

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
    organizationUnitId: string,
  ): Promise<Array<{ form: RequirementFormEntity; order: number }>> {
    const rows = await this.db.query.organizationUnitRequiredForms.findMany({
      where: { organizationUnitId },
      orderBy: { order: 'asc' },
      with: { form: true },
    });

    return rows
      .map((row) => ({
        form: row.form,
        order: row.order,
      }))
      .filter((row): row is { form: RequirementFormEntity; order: number } =>
        Boolean(row.form),
      );
  }

  async getRequiredFormStatuses(
    userId: string,
    organizationUnitId: string,
  ): Promise<RequiredFormStatus[]> {
    const requiredForms = await this.getRequiredForms(organizationUnitId);

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

  async hasRequiredForms(organizationUnitId: string): Promise<boolean> {
    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { requiredFormsEnabled: true },
    });

    if (!orgUnit?.requiredFormsEnabled) {
      return false;
    }

    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.organizationUnitRequiredForms)
      .where(
        eq(
          schema.organizationUnitRequiredForms.organizationUnitId,
          organizationUnitId,
        ),
      );

    return (row?.count ?? 0) > 0;
  }

  async areRequiredFormsSatisfied(
    userId: string,
    organizationUnitId: string,
  ): Promise<boolean> {
    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
      columns: { requiredFormsEnabled: true },
    });

    if (!orgUnit?.requiredFormsEnabled) {
      return true;
    }

    const statuses = await this.getRequiredFormStatuses(
      userId,
      organizationUnitId,
    );

    if (statuses.length === 0) {
      return true;
    }

    return statuses.every((s) => s.submitted);
  }

  async setRequiredForms(
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

    return this.getRequiredForms(organizationUnitId);
  }

  async isFormRequiredByAnyOrgUnit(formId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.organizationUnitRequiredForms)
      .where(eq(schema.organizationUnitRequiredForms.formId, formId));

    return (row?.count ?? 0) > 0;
  }

  async setRequiredFormsEnabled(
    organizationUnitId: string,
    enabled: boolean,
  ): Promise<OrganizationUnitEntity> {
    const orgUnit = await this.db.query.organizationUnits.findFirst({
      where: { id: organizationUnitId },
    });

    if (!orgUnit) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    const [updated] = await this.db
      .update(schema.organizationUnits)
      .set({ requiredFormsEnabled: enabled })
      .where(eq(schema.organizationUnits.id, organizationUnitId))
      .returning();

    if (!updated) {
      throw new NotFoundGraphQLError('Organization unit not found');
    }

    return updated;
  }
}
