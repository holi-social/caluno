import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';
import type { Database } from '../../database/database.module';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import {
  BadRequestGraphQLError,
  ConflictGraphQLError,
  ForbiddenGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import { OrganizationService } from '../../organization/organization.service';
import type { PendingSignee } from '../accounting.types';
import { SigneeType } from '../enums';
import type { ContractSignatureEntity } from '../schemas/contract-signature.schema';
import type { DocumentTemplateEntity } from '../schemas/document-template.schema';
import type { InvoiceSignatureEntity } from '../schemas/invoice-signature.schema';

/**
 * Shared signing-chain logic used by both ContractService and InvoiceService,
 * since contracts and invoices go through the same volunteer -> permission
 * holder signing flow on top of otherwise unrelated tables.
 */
@Injectable()
export class DocumentSigningService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: Database,
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
  ) {}

  orderSignatures<T extends { order: number; signedAt: Date | null }>(
    signatures: T[],
  ): T[] {
    return [...signatures].sort((a, b) => a.order - b.order);
  }

  assertAwaitingSignature<T extends string>(
    status: T,
    awaitingStatuses: T[],
  ): void {
    if (!awaitingStatuses.includes(status)) {
      throw new ConflictGraphQLError('Document is not awaiting a signature');
    }
  }

  assertPendingSignature<T extends { order: number; signedAt: Date | null }>(
    pendingIndex: number,
    orderedSignatures: T[],
  ): T {
    if (pendingIndex === -1) {
      throw new ConflictGraphQLError('Document has no pending signature');
    }
    return orderedSignatures[pendingIndex];
  }

  assertReason(reason: string): void {
    if (!reason.trim()) {
      throw new BadRequestGraphQLError('A decline reason is required');
    }
  }

  async assertSigneeAuthorized(
    userId: string,
    volunteerId: string,
    signeeType: SigneeType,
    requiredPermissionId: string | null,
    organizationId: string,
  ): Promise<void> {
    if (signeeType === SigneeType.VOLUNTEER) {
      if (userId !== volunteerId) {
        throw new ForbiddenGraphQLError(
          'Only the volunteer this document belongs to can sign at this step',
        );
      }
      return;
    }

    const eligibleUserIds = await this.findEligiblePermissionHolderIds(
      requiredPermissionId,
      organizationId,
    );
    if (!eligibleUserIds.includes(userId)) {
      throw new ForbiddenGraphQLError(
        'User does not hold the required permission to sign at this step',
      );
    }
  }

  async resolvePendingSignee(
    signatures: (ContractSignatureEntity | InvoiceSignatureEntity)[],
    volunteerId: string,
    organizationId: string,
  ): Promise<PendingSignee | null> {
    const pending = this.orderSignatures(signatures).find((s) => !s.signedAt);
    if (!pending) {
      return null;
    }
    if (pending.signeeType === SigneeType.VOLUNTEER) {
      return { signeeType: SigneeType.VOLUNTEER, userId: volunteerId };
    }

    const permission = pending.requiredPermissionId
      ? await this.db.query.permissions.findFirst({
          where: { id: pending.requiredPermissionId },
        })
      : undefined;
    if (!permission) {
      throw new ConflictGraphQLError(
        'Permission-holder signature step is missing its required permission',
      );
    }

    const eligibleUserIds = await this.findEligiblePermissionHolderIds(
      pending.requiredPermissionId,
      organizationId,
    );
    return {
      signeeType: SigneeType.PERMISSION_HOLDER,
      permissionKey: permission.key,
      eligibleUserIds,
    };
  }

  organizationIdOf(documentTemplate: DocumentTemplateEntity | null): string {
    if (!documentTemplate) {
      throw new ConflictGraphQLError('Document is missing its template');
    }
    return documentTemplate.organizationId;
  }

  private async findEligiblePermissionHolderIds(
    requiredPermissionId: string | null,
    organizationId: string,
  ): Promise<string[]> {
    if (!requiredPermissionId) {
      throw new ConflictGraphQLError(
        'Permission-holder signature step is missing its required permission',
      );
    }

    const permission = await this.db.query.permissions.findFirst({
      where: { id: requiredPermissionId },
    });
    if (!permission) {
      throw new NotFoundGraphQLError(
        `Permission with ID ${requiredPermissionId} not found`,
      );
    }

    const rootUnit =
      await this.organizationService.findRootUnit(organizationId);
    if (!rootUnit) {
      throw new NotFoundGraphQLError(
        `No root organization unit found for organization ${organizationId}`,
      );
    }

    const eligibleUsers = await this.authService.findUsersWithPermission(
      rootUnit.id,
      permission.key,
    );
    return eligibleUsers.map((user) => user.id);
  }
}
