import { Args, Context, ID, Int, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../../graphql/errors';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { MembershipService } from '../../membership/membership.service';
import { OrganizationUnitService } from '../../organization/organization-unit.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { UserService } from '../../user/user.service';
import { ReimbursementRateMapper, ReimbursementTypeMapper } from '../mappers';
import { BundleDownloadStatus } from '../models/bundle-download-status.model';
import { ManualBaseline } from '../models/manual-baseline.model';
import { ReimbursementRate } from '../models/reimbursement-rate.model';
import { ReimbursementRateService } from '../services';

@Resolver(() => ReimbursementRate)
export class ReimbursementMutationResolver {
  constructor(
    private readonly reimbursementRateService: ReimbursementRateService,
    private readonly reimbursementRateMapper: ReimbursementRateMapper,
    private readonly organizationUnitService: OrganizationUnitService,
    private readonly membershipService: MembershipService,
    private readonly userMapper: UserMapper,
    private readonly reimbursementTypeMapper: ReimbursementTypeMapper,
    private readonly userService: UserService,
  ) {}

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => ReimbursementRate)
  async setReimbursementRate(
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('hourlyRateCents', { type: () => Int }) hourlyRateCents: number,
    @Args('organizationUnitId', { type: () => ID, nullable: true })
    organizationUnitId: string | null | undefined,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<ReimbursementRate> {
    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }
    if (
      organizationUnitId &&
      organizationUnitId !== context.organizationUnitId
    ) {
      const ancestorIds =
        await this.organizationUnitService.listInclusiveAncestorUnitIds(
          organizationUnitId,
        );
      if (!ancestorIds.includes(context.organizationUnitId)) {
        throw new NotFoundGraphQLError('Organization unit not found');
      }
    }

    const rate = await this.reimbursementRateService.setReimbursementRate(
      organizationId,
      reimbursementTypeId,
      hourlyRateCents,
      organizationUnitId ?? undefined,
    );
    return this.reimbursementRateMapper.toModelOrThrow(rate);
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => BundleDownloadStatus)
  async recordBundleDownload(
    @Args('volunteerId', { type: () => ID }) volunteerId: string,
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<BundleDownloadStatus> {
    const memberships =
      await this.membershipService.getMyMemberships(volunteerId);
    let inScope = false;
    for (const membership of memberships) {
      if (!membership.organizationUnitId) continue;
      const ancestorIds =
        await this.organizationUnitService.listInclusiveAncestorUnitIds(
          membership.organizationUnitId,
        );
      if (ancestorIds.includes(context.organizationUnitId)) {
        inScope = true;
        break;
      }
    }
    if (!inScope) {
      throw new NotFoundGraphQLError('Volunteer not found');
    }

    const status = await this.reimbursementRateService.recordBundleDownload(
      volunteerId,
      reimbursementTypeId,
      session.user.id,
    );

    const [volunteer, reimbursementType, downloadedByUser] = await Promise.all([
      this.userService.findByIdOrThrow(status.volunteerId),
      this.reimbursementRateService.findReimbursementTypeById(
        status.reimbursementTypeId,
      ),
      status.downloadedByUserId
        ? this.userService.findById(status.downloadedByUserId)
        : Promise.resolve(undefined),
    ]);

    return {
      volunteer: this.userMapper.toModelOrThrow(volunteer),
      reimbursementType:
        this.reimbursementTypeMapper.toModelOrThrow(reimbursementType),
      downloadedAt: status.downloadedAt,
      downloadedByUser: this.userMapper.toModel(downloadedByUser),
    };
  }

  @Permissions(PERMISSIONS.ACCOUNTING_MANAGE)
  @Mutation(() => ManualBaseline)
  async setManualBaseline(
    @Args('volunteerId', { type: () => ID }) volunteerId: string,
    @Args('reimbursementTypeId', { type: () => ID })
    reimbursementTypeId: string,
    @Args('year', { type: () => Int }) year: number,
    @Args('amountCents', { type: () => Int }) amountCents: number,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<ManualBaseline> {
    if (amountCents < 0) {
      throw new BadRequestGraphQLError('Amount must not be negative');
    }

    const memberships =
      await this.membershipService.getMyMemberships(volunteerId);
    let inScope = false;
    for (const membership of memberships) {
      if (!membership.organizationUnitId) continue;
      const ancestorIds =
        await this.organizationUnitService.listInclusiveAncestorUnitIds(
          membership.organizationUnitId,
        );
      if (ancestorIds.includes(context.organizationUnitId)) {
        inScope = true;
        break;
      }
    }
    if (!inScope) {
      throw new NotFoundGraphQLError('Volunteer not found');
    }

    const organizationId =
      await this.organizationUnitService.findOrganizationIdByUnitId(
        context.organizationUnitId,
      );
    if (!organizationId) {
      throw new NotFoundGraphQLError('Organization not found');
    }

    const baseline = await this.reimbursementRateService.setManualBaseline(
      organizationId,
      volunteerId,
      reimbursementTypeId,
      year,
      amountCents,
      session.user.id,
    );

    const [volunteer, reimbursementType, updatedByUser] = await Promise.all([
      this.userService.findByIdOrThrow(baseline.volunteerId),
      this.reimbursementRateService.findReimbursementTypeById(
        baseline.reimbursementTypeId,
      ),
      this.userService.findById(session.user.id),
    ]);

    return {
      volunteer: this.userMapper.toModelOrThrow(volunteer),
      reimbursementType:
        this.reimbursementTypeMapper.toModelOrThrow(reimbursementType),
      year: baseline.year,
      amountCents: baseline.amountCents,
      updatedAt: baseline.updatedAt ?? baseline.createdAt,
      updatedByUser: this.userMapper.toModel(updatedByUser),
    };
  }
}
