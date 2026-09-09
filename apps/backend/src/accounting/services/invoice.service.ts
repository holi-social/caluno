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
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import { ShiftInviteStatus } from '../../shift/enums';
import type { TimeEntryEntity } from '../../time-tracking/schemas/time-entry.schema';
import type {
  EligibleTimesheetVolunteer,
  InvoiceFilter,
  InvoiceWithRelations,
  PendingSignee,
} from '../accounting.types';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  InvoiceStatus,
  SigneeType,
} from '../enums';
import type { CreateInvoiceInput } from '../inputs/create-invoice.input';
import { toFieldOverridesMap } from '../inputs/document-field-override.input';
import type { InvoiceEntity } from '../schemas/invoice.schema';
import type { InvoiceStatusChangeEntity } from '../schemas/invoice-status-change.schema';
import { ContractService } from './contract.service';
import { DocumentNotificationService } from './document-notification.service';
import { DocumentProfileRequirementService } from './document-profile-requirement.service';
import { DocumentRenderingService } from './document-rendering.service';
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
    private readonly documentNotificationService: DocumentNotificationService,
    private readonly documentProfileRequirementService: DocumentProfileRequirementService,
    private readonly documentRenderingService: DocumentRenderingService,
    private readonly postHogService: PostHogService,
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
        organizationUnit: true,
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
      // Time entries stay claimed while tied to a live (non-declined)
      // invoice. Declining releases the claim (see declineInvoice), so a
      // released row no longer excludes the entry here.
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
        and(
          eq(schema.invoiceTimeEntries.timeEntryId, schema.timeEntries.id),
          eq(schema.invoiceTimeEntries.released, false),
        ),
      )
      .where(and(...conditions));

    return rows.map((row) => row.timeEntry);
  }

  /**
   * Volunteers in the unit that still need a timesheet: they have at least
   * one eligible (unclaimed, completed, in-period) time entry, grouped by
   * volunteer and reimbursement type with the summed eligible hours.
   */
  async findVolunteersNeedingTimesheets(
    organizationUnitId: string,
    periodStart?: Date,
    periodEnd?: Date,
  ): Promise<EligibleTimesheetVolunteer[]> {
    const conditions = [
      eq(schema.timeEntries.organizationUnitId, organizationUnitId),
      isNotNull(schema.timeEntries.endedAt),
      isNotNull(schema.timeEntries.reimbursementTypeId),
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
        and(
          eq(schema.invoiceTimeEntries.timeEntryId, schema.timeEntries.id),
          eq(schema.invoiceTimeEntries.released, false),
        ),
      )
      .where(and(...conditions));

    const hoursByVolunteerType = new Map<string, number>();
    for (const row of rows) {
      const entry = row.timeEntry;
      if (!entry.endedAt || !entry.reimbursementTypeId) continue;
      const key = `${entry.volunteerId}:${entry.reimbursementTypeId}`;
      const hours =
        (entry.endedAt.getTime() - entry.startedAt.getTime()) / 3_600_000;
      hoursByVolunteerType.set(
        key,
        (hoursByVolunteerType.get(key) ?? 0) + hours,
      );
    }

    return Array.from(hoursByVolunteerType, ([key, eligibleHours]) => {
      const [volunteerId, reimbursementTypeId] = key.split(':');
      return {
        volunteerId,
        reimbursementTypeId,
        eligibleHours: Math.round(eligibleHours * 100) / 100,
      };
    });
  }

  /**
   * Volunteers who signed up for (JOINED) a paid shift instance in the given
   * year but have no contract or invoice for that reimbursement type yet.
   * Scoped org-wide: a shift counts when its organization unit belongs to
   * `organizationId`, mirroring how the accounting board scopes contracts and
   * invoices to the organization rather than a single unit.
   *
   * "Paid" = the instance's effective reimbursement type is non-null
   * (`shiftInstances.overrideReimbursementTypeId ?? shifts.reimbursementTypeId`).
   * Returns one row per (volunteer, reimbursement type), excluding any pair
   * that already has a non-declined contract or an invoice overlapping the
   * requested year — those are already surfaced by the contract/invoice maps.
   */
  async findPaidShiftSignupVolunteers(
    organizationId: string,
    year: number,
  ): Promise<Array<{ volunteerId: string; reimbursementTypeId: string }>> {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1));

    const rows = await this.db
      .select({
        volunteerId: schema.shiftInstanceInvites.userId,
        overrideReimbursementTypeId:
          schema.shiftInstances.overrideReimbursementTypeId,
        shiftReimbursementTypeId: schema.shifts.reimbursementTypeId,
      })
      .from(schema.shiftInstanceInvites)
      .innerJoin(
        schema.shiftInstances,
        eq(schema.shiftInstances.id, schema.shiftInstanceInvites.instanceId),
      )
      .innerJoin(
        schema.shifts,
        eq(schema.shifts.id, schema.shiftInstances.masterId),
      )
      .innerJoin(
        schema.organizationUnits,
        eq(schema.organizationUnits.id, schema.shifts.organizationUnitId),
      )
      .where(
        and(
          eq(schema.shiftInstanceInvites.status, ShiftInviteStatus.JOINED),
          eq(schema.shiftInstances.isCancelled, false),
          eq(schema.organizationUnits.organizationId, organizationId),
          gte(schema.shiftInstances.actualStartsAt, yearStart),
          lt(schema.shiftInstances.actualStartsAt, yearEnd),
        ),
      );

    const signups = new Map<
      string,
      { volunteerId: string; reimbursementTypeId: string }
    >();
    for (const row of rows) {
      const reimbursementTypeId =
        row.overrideReimbursementTypeId ?? row.shiftReimbursementTypeId;
      if (!reimbursementTypeId) continue;
      const key = `${row.volunteerId}:${reimbursementTypeId}`;
      if (!signups.has(key)) {
        signups.set(key, { volunteerId: row.volunteerId, reimbursementTypeId });
      }
    }
    if (signups.size === 0) return [];

    const entries = [...signups.values()];
    const volunteerIds = [
      ...new Set(entries.map((entry) => entry.volunteerId)),
    ];
    const reimbursementTypeIds = [
      ...new Set(entries.map((entry) => entry.reimbursementTypeId)),
    ];

    const [contracts, invoices] = await Promise.all([
      this.db.query.contracts.findMany({
        where: {
          volunteerId: { in: volunteerIds },
          reimbursementTypeId: { in: reimbursementTypeIds },
          contractStatus: { ne: ContractStatus.DECLINED },
          periodStart: { lt: yearEnd },
          periodEnd: { gt: yearStart },
        },
        columns: { volunteerId: true, reimbursementTypeId: true },
      }),
      this.db.query.invoices.findMany({
        where: {
          volunteerId: { in: volunteerIds },
          reimbursementTypeId: { in: reimbursementTypeIds },
          periodStart: { lt: yearEnd },
          periodEnd: { gt: yearStart },
        },
        columns: { volunteerId: true, reimbursementTypeId: true },
      }),
    ]);

    const excluded = new Set<string>();
    for (const contract of contracts) {
      excluded.add(`${contract.volunteerId}:${contract.reimbursementTypeId}`);
    }
    for (const invoice of invoices) {
      excluded.add(`${invoice.volunteerId}:${invoice.reimbursementTypeId}`);
    }

    return entries.filter(
      (entry) =>
        !excluded.has(`${entry.volunteerId}:${entry.reimbursementTypeId}`),
    );
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

    // The unit must have the profile fields its documents render (e.g. city /
    // address) before one is created — otherwise the PDF comes out with gaps
    // the org can't fix inline. The account manager is told to complete the
    // unit's profile first.
    const missingOrg =
      await this.documentProfileRequirementService.missingOrgProfileSources(
        organizationId,
        input.organizationUnitId,
        template.body,
      );
    if (missingOrg.length > 0) {
      throw new BadRequestGraphQLError(
        'Your organization is missing details required for this document: ' +
          missingOrg.join(', ') +
          '. Please complete your organization profile before creating documents.',
      );
    }

    const activeContract = await this.contractService.findActiveContract(
      input.volunteerId,
      input.reimbursementTypeId,
    );

    if (!activeContract) {
      const contractYear = input.periodStart.getUTCFullYear();
      const yearStart = new Date(Date.UTC(contractYear, 0, 1));
      const yearEnd = new Date(Date.UTC(contractYear + 1, 0, 1));
      const existingContract = await this.db.query.contracts.findFirst({
        where: {
          volunteerId: input.volunteerId,
          reimbursementTypeId: input.reimbursementTypeId,
          contractStatus: { ne: ContractStatus.DECLINED },
          periodEnd: { gt: yearStart },
          periodStart: { lt: yearEnd },
        },
      });
      if (!existingContract) {
        await this.contractService.createDraftContract(
          organizationId,
          {
            organizationUnitId: input.organizationUnitId,
            volunteerId: input.volunteerId,
            reimbursementTypeId: input.reimbursementTypeId,
            periodStart: yearStart,
            periodEnd: yearEnd,
          },
          actorUserId,
        );
      }
    }

    const invoice = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.invoices)
        .values({
          documentTemplateId: template.id,
          volunteerId: input.volunteerId,
          reimbursementTypeId: input.reimbursementTypeId,
          organizationUnitId: input.organizationUnitId,
          invoiceStatus: this.nextInvoiceStatus(orderedSignees[0].signeeType),
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          totalAmountCents,
          totalHours,
          isNonCompliant: !activeContract,
          resolvedBody: structuredClone(template.body),
          fieldOverrides: toFieldOverridesMap(input.fieldOverrides),
        })
        .returning();

      await tx.insert(schema.invoiceSignatures).values(
        orderedSignees.map((signee) => ({
          invoiceId: created.id,
          order: signee.order,
          signeeType: signee.signeeType,
          requiredPermissionId: signee.requiredPermissionId,
        })),
      );

      // Claim the time entries immediately so they can't be pulled into a
      // second invoice while this one is still pending signatures.
      await tx.insert(schema.invoiceTimeEntries).values(
        selected.map((entry) => ({
          invoiceId: created.id,
          timeEntryId: entry.id,
        })),
      );

      await tx.insert(schema.invoiceStatusChanges).values({
        invoiceId: created.id,
        type: DocumentStatusChange.CREATED,
        actorUserId,
      });

      return created;
    });

    // Render the unsigned PDF now so the volunteer can preview the document
    // before they sign it. Previously the file was only produced after the
    // final signature, so the volunteer was asked to sign/decline content
    // they could never see (VOLI-1216). Rendering here is best-effort — a
    // storage/config failure just leaves downloadUrl unset for now.
    const fullInvoice = await this.findInvoice(invoice.id);
    await this.documentRenderingService.renderAndAttachPdf(
      fullInvoice,
      actorUserId,
    );

    this.postHogService.capture({
      event: POSTHOG_EVENT.INVOICE_CREATE,
      userId: invoice.volunteerId || actorUserId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationId,
        organization_unit_id: input.organizationUnitId ?? undefined,
      },
    });

    // The volunteer only hears about the document when it needs their
    // signature — generation itself is not news (accounting-volunteer-documents).
    if (invoice.invoiceStatus === InvoiceStatus.AWAITING_VOLUNTEER_SIGNATURE) {
      await this.documentNotificationService.notifyAwaitingVolunteerSignature({
        organizationId,
        volunteerUserId: invoice.volunteerId,
        documentId: invoice.id,
        documentKind: DocumentKind.INVOICE,
      });
    }

    return invoice;
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

    // The volunteer's own signature is the first step of the chain. Require
    // the profile fields the template reads before they can sign, so the
    // signed document never comes out with "—" gaps in place of them.
    if (pending.signeeType === SigneeType.VOLUNTEER) {
      const missing =
        await this.documentProfileRequirementService.missingProfileSources(
          invoice.volunteerId,
          invoice.documentTemplate?.body,
        );
      if (missing.length > 0) {
        throw new BadRequestGraphQLError(
          'Your profile is missing details required for this document: ' +
            missing.join(', ') +
            '. Please complete your profile before signing.',
        );
      }
    }

    const isFinal = pendingIndex === orderedSignatures.length - 1;

    const updated = await this.db.transaction(async (tx) => {
      await tx
        .update(schema.invoiceSignatures)
        .set({ signedByUserId: userId, signedAt: new Date() })
        .where(eq(schema.invoiceSignatures.id, pending.id));

      const [signed] = await tx
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

      return signed;
    });

    // The timesheet is complete — render its PDF so it can be downloaded.
    // Failures are logged, never thrown: signing still succeeds.
    if (isFinal) {
      const full = await this.findInvoice(invoiceId);
      await this.documentRenderingService.renderAndAttachPdf(full, userId);
    }

    this.postHogService.capture({
      event: POSTHOG_EVENT.INVOICE_SIGN,
      userId: invoice.volunteerId || userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: this.documentSigningService.organizationIdOf(
          invoice.documentTemplate,
        ),
      },
    });

    return updated;
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

    const updated = await this.db.transaction(async (tx) => {
      const [declined] = await tx
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

      // Release the time entries this invoice had claimed. The declined
      // invoice and its invoiceTimeEntries rows stay around as a record
      // (and still show what was declined), but the entries themselves
      // become selectable again for a replacement document.
      await tx
        .update(schema.invoiceTimeEntries)
        .set({ released: true })
        .where(eq(schema.invoiceTimeEntries.invoiceId, invoiceId));

      return declined;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.INVOICE_DECLINE,
      userId: invoice.volunteerId || userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: this.documentSigningService.organizationIdOf(
          invoice.documentTemplate,
        ),
      },
    });

    const organizationId = this.documentSigningService.organizationIdOf(
      invoice.documentTemplate,
    );

    // The org-side decline is news to the volunteer — they had signed and
    // would otherwise never learn the document is dead. The volunteer-side
    // decline is news to whoever manages accounting — they need to correct
    // and reissue the document (VOLI-1246).
    if (updated.declinedAtSigneeType === SigneeType.PERMISSION_HOLDER) {
      await this.documentNotificationService.notifyDeclinedByOrg({
        organizationId,
        volunteerUserId: invoice.volunteerId,
        documentId: invoiceId,
        documentKind: DocumentKind.INVOICE,
        reason,
      });
    } else {
      await this.documentNotificationService.notifyDeclinedByVolunteer({
        organizationId,
        volunteerUserId: invoice.volunteerId,
        documentId: invoiceId,
        documentKind: DocumentKind.INVOICE,
        reason,
      });
    }

    return updated;
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
