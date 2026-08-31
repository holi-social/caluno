import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lt } from 'drizzle-orm';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import * as schema from '../../database/schema';
import {
  ConflictGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../../shared/observability/posthog.events';
import { PostHogService } from '../../shared/observability/posthog.service';
import type {
  ContractFilter,
  ContractWithRelations,
  PendingSignee,
} from '../accounting.types';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  SigneeType,
} from '../enums';
import type { CreateContractInput } from '../inputs/create-contract.input';
import type { ContractEntity } from '../schemas/contract.schema';
import type { ContractStatusChangeEntity } from '../schemas/contract-status-change.schema';
import { DocumentSigningService } from './document-signing.service';
import { DocumentTemplateService } from './document-template.service';

@Injectable()
export class ContractService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly documentTemplateService: DocumentTemplateService,
    private readonly documentSigningService: DocumentSigningService,
    private readonly postHogService: PostHogService,
  ) {}

  async findContract(id: string): Promise<ContractWithRelations> {
    const contract = await this.db.query.contracts.findFirst({
      where: { id },
      with: {
        documentTemplate: true,
        reimbursementType: true,
        signatures: true,
        statusChanges: true,
      },
    });
    if (!contract) {
      throw new NotFoundGraphQLError(`Contract with ID ${id} not found`);
    }
    return contract;
  }

  async findContractsForOrganization(
    organizationId: string,
    filter: ContractFilter = {},
  ): Promise<ContractEntity[]> {
    const conditions = [
      eq(schema.documentTemplates.organizationId, organizationId),
    ];
    if (filter.volunteerId) {
      conditions.push(eq(schema.contracts.volunteerId, filter.volunteerId));
    }
    if (filter.reimbursementTypeId) {
      conditions.push(
        eq(schema.contracts.reimbursementTypeId, filter.reimbursementTypeId),
      );
    }
    if (filter.status) {
      conditions.push(eq(schema.contracts.contractStatus, filter.status));
    }
    if (filter.periodStart) {
      conditions.push(gte(schema.contracts.periodEnd, filter.periodStart));
    }
    if (filter.periodEnd) {
      conditions.push(lt(schema.contracts.periodStart, filter.periodEnd));
    }

    const rows = await this.db
      .select({ contract: schema.contracts })
      .from(schema.contracts)
      .innerJoin(
        schema.documentTemplates,
        eq(schema.documentTemplates.id, schema.contracts.documentTemplateId),
      )
      .where(and(...conditions));

    return rows.map((row) => row.contract);
  }

  async findActiveContract(
    volunteerId: string,
    reimbursementTypeId: string,
  ): Promise<ContractEntity | undefined> {
    // contractStatus alone isn't enough: nothing expires it once periodEnd
    // passes (no expiry job runs yet), so an out-of-date ACTIVE row must not
    // count as compliance cover.
    return this.db.query.contracts.findFirst({
      where: {
        volunteerId,
        reimbursementTypeId,
        contractStatus: ContractStatus.ACTIVE,
        periodEnd: { gte: new Date() },
      },
    });
  }

  async createContract(
    organizationId: string,
    input: CreateContractInput,
    actorUserId: string,
  ): Promise<ContractEntity> {
    const template = await this.documentTemplateService.findActiveTemplate(
      organizationId,
      input.reimbursementTypeId,
      DocumentKind.CONTRACT,
      input.organizationUnitId,
    );
    const orderedSignees =
      await this.documentTemplateService.findOrderedTemplateSignees(
        template.id,
      );

    const contract = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(schema.contracts)
        .values({
          documentTemplateId: template.id,
          volunteerId: input.volunteerId,
          reimbursementTypeId: input.reimbursementTypeId,
          contractStatus: this.nextContractStatus(orderedSignees[0].signeeType),
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          resolvedBody: structuredClone(template.body),
        })
        .returning();

      await tx.insert(schema.contractSignatures).values(
        orderedSignees.map((signee) => ({
          contractId: created.id,
          order: signee.order,
          signeeType: signee.signeeType,
          requiredPermissionId: signee.requiredPermissionId,
        })),
      );

      await tx.insert(schema.contractStatusChanges).values({
        contractId: created.id,
        type: DocumentStatusChange.CREATED,
        actorUserId,
      });

      return created;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.CONTRACT_CREATE,
      userId: contract.volunteerId || actorUserId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: organizationId,
        organization_unit_id: input.organizationUnitId ?? undefined,
      },
    });

    return contract;
  }

  async signContract(
    contractId: string,
    userId: string,
  ): Promise<ContractEntity> {
    const contract = await this.findContract(contractId);
    this.documentSigningService.assertAwaitingSignature(
      contract.contractStatus,
      [
        ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
        ContractStatus.AWAITING_NGO_SIGNATURE,
      ],
    );

    const orderedSignatures = this.documentSigningService.orderSignatures(
      contract.signatures,
    );
    const pendingIndex = orderedSignatures.findIndex((s) => !s.signedAt);
    const pending = this.documentSigningService.assertPendingSignature(
      pendingIndex,
      orderedSignatures,
    );

    await this.documentSigningService.assertSigneeAuthorized(
      userId,
      contract.volunteerId,
      pending.signeeType,
      pending.requiredPermissionId,
      this.documentSigningService.organizationIdOf(contract.documentTemplate),
    );

    const isFinal = pendingIndex === orderedSignatures.length - 1;

    const updated = await this.db.transaction(async (tx) => {
      await tx
        .update(schema.contractSignatures)
        .set({ signedByUserId: userId, signedAt: new Date() })
        .where(eq(schema.contractSignatures.id, pending.id));

      const [signed] = await tx
        .update(schema.contracts)
        .set({
          contractStatus: isFinal
            ? ContractStatus.ACTIVE
            : this.nextContractStatus(
                orderedSignatures[pendingIndex + 1].signeeType,
              ),
        })
        .where(eq(schema.contracts.id, contractId))
        .returning();

      await tx.insert(schema.contractStatusChanges).values({
        contractId,
        type:
          pendingIndex === 0
            ? DocumentStatusChange.SIGNED
            : DocumentStatusChange.COUNTERSIGNED,
        actorUserId: userId,
      });
      if (isFinal) {
        await tx.insert(schema.contractStatusChanges).values({
          contractId,
          type: DocumentStatusChange.ACTIVATED,
          actorUserId: userId,
        });
      }

      return signed;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.CONTRACT_SIGN,
      userId: contract.volunteerId || userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: this.documentSigningService.organizationIdOf(
          contract.documentTemplate,
        ),
      },
    });

    return updated;
  }

  async declineContract(
    contractId: string,
    userId: string,
    reason: string,
  ): Promise<ContractEntity> {
    this.documentSigningService.assertReason(reason);
    const contract = await this.findContract(contractId);
    this.documentSigningService.assertAwaitingSignature(
      contract.contractStatus,
      [
        ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
        ContractStatus.AWAITING_NGO_SIGNATURE,
      ],
    );

    const pending = this.documentSigningService
      .orderSignatures(contract.signatures)
      .find((s) => !s.signedAt);
    if (!pending) {
      throw new ConflictGraphQLError(
        `Contract with ID ${contractId} has no pending signature`,
      );
    }

    await this.documentSigningService.assertSigneeAuthorized(
      userId,
      contract.volunteerId,
      pending.signeeType,
      pending.requiredPermissionId,
      this.documentSigningService.organizationIdOf(contract.documentTemplate),
    );

    const updated = await this.db.transaction(async (tx) => {
      const [declined] = await tx
        .update(schema.contracts)
        .set({
          contractStatus: ContractStatus.DECLINED,
          declineReason: reason,
          declinedByUserId: userId,
          declinedAt: new Date(),
          declinedAtSigneeType: pending.signeeType,
        })
        .where(eq(schema.contracts.id, contractId))
        .returning();

      await tx.insert(schema.contractStatusChanges).values({
        contractId,
        type: DocumentStatusChange.DECLINED,
        actorUserId: userId,
      });

      return declined;
    });

    this.postHogService.capture({
      event: POSTHOG_EVENT.CONTRACT_DECLINE,
      userId: contract.volunteerId || userId,
      properties: {
        surface: POSTHOG_SURFACE.BACKOFFICE,
        organization_id: this.documentSigningService.organizationIdOf(
          contract.documentTemplate,
        ),
      },
    });

    return updated;
  }

  async findContractStatusChanges(
    contractId: string,
  ): Promise<ContractStatusChangeEntity[]> {
    const statusChanges = await this.db.query.contractStatusChanges.findMany({
      where: { contractId },
    });
    return statusChanges.sort(
      (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
    );
  }

  async findPendingContractSignee(
    contractId: string,
  ): Promise<PendingSignee | null> {
    const contract = await this.findContract(contractId);
    return this.documentSigningService.resolvePendingSignee(
      contract.signatures,
      contract.volunteerId,
      this.documentSigningService.organizationIdOf(contract.documentTemplate),
    );
  }

  private nextContractStatus(signeeType: SigneeType): ContractStatus {
    return signeeType === SigneeType.VOLUNTEER
      ? ContractStatus.AWAITING_VOLUNTEER_SIGNATURE
      : ContractStatus.AWAITING_NGO_SIGNATURE;
  }
}
