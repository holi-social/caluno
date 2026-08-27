import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, isNotNull, isNull, lt } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { TimeEntryEntity } from '../../time-tracking/schemas/time-entry.schema';
import type {
  InvoiceFilter,
  InvoiceWithRelations,
  PendingSignee,
} from '../accounting.types';
import {
  DocumentKind,
  DocumentStatusChange,
  InvoiceStatus,
  SigneeType,
} from '../enums';
import type { CreateInvoiceInput } from '../inputs/create-invoice.input';
import type { InvoiceEntity } from '../schemas/invoice.schema';
import type { InvoiceStatusChangeEntity } from '../schemas/invoice-status-change.schema';
import { ContractService } from './contract.service';
import { DocumentSigningService } from './document-signing.service';
import { DocumentTemplateService } from './document-template.service';
import { ReimbursementRateService } from './reimbursement-rate.service';

@Injectable()
export class InvoiceService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentSigningService: DocumentSigningService,
    private readonly reimbursementRateService: ReimbursementRateService,
    private readonly contractService: ContractService,
  ) {}

  async findInvoice(id: string): Promise<InvoiceWithRelations> {
    const invoice = await this.db.query.invoices.findFirst({
      where: { id },
      with: {
        documentTemplate: true,
        reimbursementType: true,
        signatures: true,
        statusChanges: true,
        invoiceTimeEntries: true,
      },
    });
    if (!invoice) {
      throw new NotFoundGraphQLError(`Invoice with ID ${id} not found`);
    }
    return invoice;
  }

  async findInvoicesForOrganization(
    organizationId: string,
    filter: InvoiceFilter = {},
  ): Promise<InvoiceEntity[]> {
    const conditions = [
      eq(schema.documentTemplates.organizationId, organizationId),
    ];
    if (filter.volunteerId) {
      conditions.push(eq(schema.invoices.volunteerId, filter.volunteerId));
    }
    if (filter.reimbursementTypeId) {
      conditions.push(
        eq(schema.invoices.reimbursementTypeId, filter.reimbursementTypeId),
      );
    }
    if (filter.status) {
      conditions.push(eq(schema.invoices.invoiceStatus, filter.status));
    }
    if (filter.periodStart) {
      conditions.push(gte(schema.invoices.periodEnd, filter.periodStart));
    }
    if (filter.periodEnd) {
      conditions.push(lt(schema.invoices.periodStart, filter.periodEnd));
    }

    const rows = await this.db
      .select({ invoice: schema.invoices })
      .from(schema.invoices)
      .innerJoin(
        schema.documentTemplates,
        eq(schema.documentTemplates.id, schema.invoices.documentTemplateId),
      )
      .where(and(...conditions));

    return rows.map((row) => row.invoice);
  }

  async findEligibleTimeEntries(
    volunteerId: string,
    reimbursementTypeId: string,
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<TimeEntryEntity[]> {
    const conditions = [
      eq(schema.timeEntries.volunteerId, volunteerId),
      eq(schema.timeEntries.reimbursementTypeId, reimbursementTypeId),
      isNotNull(schema.timeEntries.endedAt),
      // Time entries stay claimed once pulled into any invoice, even a
      // declined one - reissuing means picking up fresh, unclaimed hours.
      isNull(schema.invoiceTimeEntries.id),
    ];
    if (periodStart) {
      conditions.push(gte(schema.timeEntries.startedAt, periodStart));
    }
    if (periodEnd) {
      conditions.push(lt(schema.timeEntries.startedAt, periodEnd));
    }

    const rows = await this.db
      .select({ timeEntry: schema.timeEntries })
      .from(schema.timeEntries)
      .leftJoin(
        schema.invoiceTimeEntries,
        eq(schema.invoiceTimeEntries.timeEntryId, schema.timeEntries.id),
      )
      .where(and(...conditions));

    return rows.map((row) => row.timeEntry);
  }

  async createInvoice(
    organizationId: string,
    input: CreateInvoiceInput,
    actorUserId: string,
  ): Promise<InvoiceEntity> {
    if (input.timeEntryIds.length === 0) {
      throw new BadRequestGraphQLError(
        'At least one time entry must be selected',
      );
    }

    const eligibleEntries = await this.findEligibleTimeEntries(
      input.volunteerId,
      input.reimbursementTypeId,
    );
    const eligibleById = new Map(
      eligibleEntries.map((entry) => [entry.id, entry]),
    );
    const selected = input.timeEntryIds.map((id) => {
      const entry = eligibleById.get(id);
      if (!entry) {
        throw new ConflictGraphQLError(
          `Time entry ${id} is not eligible for this invoice`,
        );
      }
      return entry;
    });

    const totalHours =
      Math.round(
        selected.reduce((sum, entry) => sum + this.durationHours(entry), 0) *
          100,
      ) / 100;
    const rateCents = await this.reimbursementRateService.getEffectiveRateCents(
      organizationId,
      input.organizationUnitId,
      input.reimbursementTypeId,
    );
    const totalAmountCents = Math.round(totalHours * rateCents);

    const template = await this.documentTemplateService.findActiveTemplate(
      organizationId,
      input.reimbursementTypeId,
      DocumentKind.INVOICE,
      input.organizationUnitId,
    );
    const orderedSignees =
      await this.documentTemplateService.findOrderedTemplateSignees(
        template.id,
      );
    const activeContract = await this.contractService.findActiveContract(
      input.volunteerId,
      input.reimbursementTypeId,
    );

    return this.db.transaction(async (tx) => {
      const [invoice] = await tx
        .insert(schema.invoices)
        .values({
          documentTemplateId: template.id,
          volunteerId: input.volunteerId,
          reimbursementTypeId: input.reimbursementTypeId,
          invoiceStatus: this.nextInvoiceStatus(orderedSignees[0].signeeType),
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          totalAmountCents,
          totalHours,
          isNonCompliant: !activeContract,
          resolvedBody: structuredClone(template.body),
        })
        .returning();

      await tx.insert(schema.invoiceSignatures).values(
        orderedSignees.map((signee) => ({
          invoiceId: invoice.id,
          order: signee.order,
          signeeType: signee.signeeType,
          requiredPermissionId: signee.requiredPermissionId,
        })),
      );

      // Claim the time entries immediately so they can't be pulled into a
      // second invoice while this one is still pending signatures.
      await tx.insert(schema.invoiceTimeEntries).values(
        selected.map((entry) => ({
          invoiceId: invoice.id,
          timeEntryId: entry.id,
        })),
      );

      await tx.insert(schema.invoiceStatusChanges).values({
        invoiceId: invoice.id,
        type: DocumentStatusChange.CREATED,
        actorUserId,
      });

      return invoice;
    });
  }

  async signInvoice(invoiceId: string, userId: string): Promise<InvoiceEntity> {
    const invoice = await this.findInvoice(invoiceId);
    this.documentSigningService.assertAwaitingSignature(invoice.invoiceStatus, [
      InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE,
      InvoiceStatus.AWAITING_SUPERVISOR_SIGNATURE,
    ]);

    const orderedSignatures = this.documentSigningService.orderSignatures(
      invoice.signatures,
    );
    const pendingIndex = orderedSignatures.findIndex((s) => !s.signedAt);
    const pending = this.documentSigningService.assertPendingSignature(
      pendingIndex,
      orderedSignatures,
    );

    await this.documentSigningService.assertSigneeAuthorized(
      userId,
      invoice.volunteerId,
      pending.signeeType,
      pending.requiredPermissionId,
      this.documentSigningService.organizationIdOf(invoice.documentTemplate),
    );

    const isFinal = pendingIndex === orderedSignatures.length - 1;

    return this.db.transaction(async (tx) => {
      await tx
        .update(schema.invoiceSignatures)
        .set({ signedByUserId: userId, signedAt: new Date() })
        .where(eq(schema.invoiceSignatures.id, pending.id));

      const [updated] = await tx
        .update(schema.invoices)
        .set({
          invoiceStatus: isFinal
            ? InvoiceStatus.READY
            : this.nextInvoiceStatus(
                orderedSignatures[pendingIndex + 1].signeeType,
              ),
        })
        .where(eq(schema.invoices.id, invoiceId))
        .returning();

      await tx.insert(schema.invoiceStatusChanges).values({
        invoiceId,
        type:
          pendingIndex === 0
            ? DocumentStatusChange.SIGNED
            : DocumentStatusChange.COUNTERSIGNED,
        actorUserId: userId,
      });

      if (isFinal) {
        await tx.insert(schema.invoiceStatusChanges).values({
          invoiceId,
          type: DocumentStatusChange.ACTIVATED,
          actorUserId: userId,
        });

        const timeEntryIds = invoice.invoiceTimeEntries.map(
          (entry) => entry.timeEntryId,
        );
        if (timeEntryIds.length > 0) {
          await tx
            .update(schema.timeEntries)
            .set({ isPaid: true })
            .where(inArray(schema.timeEntries.id, timeEntryIds));
        }
      }

      return updated;
    });
  }

  async declineInvoice(
    invoiceId: string,
    userId: string,
    reason: string,
  ): Promise<InvoiceEntity> {
    this.documentSigningService.assertReason(reason);
    const invoice = await this.findInvoice(invoiceId);
    this.documentSigningService.assertAwaitingSignature(invoice.invoiceStatus, [
      InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE,
      InvoiceStatus.AWAITING_SUPERVISOR_SIGNATURE,
    ]);

    const pending = this.documentSigningService
      .orderSignatures(invoice.signatures)
      .find((s) => !s.signedAt);
    if (!pending) {
      throw new ConflictGraphQLError(
        `Invoice with ID ${invoiceId} has no pending signature`,
      );
    }

    await this.documentSigningService.assertSigneeAuthorized(
      userId,
      invoice.volunteerId,
      pending.signeeType,
      pending.requiredPermissionId,
      this.documentSigningService.organizationIdOf(invoice.documentTemplate),
    );

    return this.db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.invoices)
        .set({
          invoiceStatus: InvoiceStatus.DECLINED,
          declineReason: reason,
          declinedByUserId: userId,
          declinedAt: new Date(),
          declinedAtSigneeType: pending.signeeType,
        })
        .where(eq(schema.invoices.id, invoiceId))
        .returning();

      await tx.insert(schema.invoiceStatusChanges).values({
        invoiceId,
        type: DocumentStatusChange.DECLINED,
        actorUserId: userId,
      });

      return updated;
    });
  }

  async findInvoiceStatusChanges(
    invoiceId: string,
  ): Promise<InvoiceStatusChangeEntity[]> {
    const statusChanges = await this.db.query.invoiceStatusChanges.findMany({
      where: { invoiceId },
    });
    return statusChanges.sort(
      (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
    );
  }

  async findPendingInvoiceSignee(
    invoiceId: string,
  ): Promise<PendingSignee | null> {
    const invoice = await this.findInvoice(invoiceId);
    return this.documentSigningService.resolvePendingSignee(
      invoice.signatures,
      invoice.volunteerId,
      this.documentSigningService.organizationIdOf(invoice.documentTemplate),
    );
  }

  private nextInvoiceStatus(signeeType: SigneeType): InvoiceStatus {
    return signeeType === SigneeType.VOLUNTEER
      ? InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE
      : InvoiceStatus.AWAITING_SUPERVISOR_SIGNATURE;
  }

  private durationHours(entry: TimeEntryEntity): number {
    if (!entry.endedAt) {
      throw new ConflictGraphQLError(
        `Time entry ${entry.id} has not been ended yet`,
      );
    }
    return (entry.endedAt.getTime() - entry.startedAt.getTime()) / 3_600_000;
  }
}
