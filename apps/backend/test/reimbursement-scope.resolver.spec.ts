import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { ReimbursementTypeMapper } from '../src/accounting/mappers';
import { ReimbursementRateMapper } from '../src/accounting/mappers/reimbursement-rate.mapper';
import { ReimbursementMutationResolver } from '../src/accounting/resolvers/reimbursement-mutation.resolver';
import { ReimbursementQueryResolver } from '../src/accounting/resolvers/reimbursement-query.resolver';
import { ReimbursementRateService } from '../src/accounting/services/reimbursement-rate.service';
import type { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import type { AuthenticatedGraphQLContext } from '../src/graphql/graphql.context';
import { MembershipService } from '../src/membership/membership.service';
import type { NotificationService } from '../src/notification';
import { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { OrganizationUnitDataModule } from '../src/organization/organization-unit-data.module';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import type { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import type { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import type { PostHogService } from '../src/shared/observability/posthog.service';
import type { FileService } from '../src/storage/services/file.service';
import { UserMapper } from '../src/user/mappers/user.mapper';
import { createReimbursementType } from './factories/accounting.factory';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

/**
 * Resolver-level scope checks for the reimbursement-rate queries/mutation
 * (Critical/Important findings #2-#4 from the final whole-branch review):
 * a caller must be the target `organizationUnitId` itself, or an ancestor
 * of it, not merely a member of the same organization.
 */
describe('reimbursement-rate resolver unit scoping', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let organizationUnitService: OrganizationUnitService;
  let queryResolver: ReimbursementQueryResolver;
  let mutationResolver: ReimbursementMutationResolver;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        DatabaseModule,
        OrganizationUnitDataModule,
      ],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    const organizationUnitDataService = moduleRef.get(
      OrganizationUnitDataService,
    );
    organizationUnitService = new OrganizationUnitService(
      db,
      {} as FileService,
      organizationUnitDataService,
    );
    const membershipService = new MembershipService(
      db,
      {} as RequirementProfileService,
      {} as AuthService,
      {} as NotificationService,
      {} as RequiredFormService,
      { captureUserJoinedOrg: () => {} } as unknown as PostHogService,
    );
    const reimbursementRateService = new ReimbursementRateService(
      db,
      organizationUnitDataService,
      membershipService,
    );
    queryResolver = new ReimbursementQueryResolver(
      reimbursementRateService,
      new ReimbursementTypeMapper(),
      organizationUnitService,
      new UserMapper(),
    );
    mutationResolver = new ReimbursementMutationResolver(
      reimbursementRateService,
      new ReimbursementRateMapper(),
      organizationUnitService,
    );
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  /**
   * Org with a root unit and two independent child branches (A and B),
   * each with their own sub-unit — enough to exercise "sibling", "unrelated
   * branch", and "ancestor/descendant" scope relationships.
   */
  const setupOrgTree = async () => {
    const { organization, type } = await createOrganizationWithType(
      db,
      `Scope Org ${crypto.randomUUID()}`,
    );
    const root = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    const branchA = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'branch-a',
      parentId: root.id,
    });
    const branchB = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'branch-b',
      parentId: root.id,
    });
    const branchASub = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'branch-a-sub',
      parentId: branchA.id,
    });
    return { organization, root, branchA, branchB, branchASub };
  };

  const contextFor = (
    organizationUnitId: string,
  ): AuthenticatedGraphQLContext =>
    ({
      user: { id: `test-user-${crypto.randomUUID()}` },
      organizationUnitId,
    }) as AuthenticatedGraphQLContext;

  describe('setReimbursementRate', () => {
    it('rejects a caller from a sibling branch targeting another branch', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA, branchB } = await setupOrgTree();

      await expect(
        mutationResolver.setReimbursementRate(
          reimbursementType.id,
          2_000,
          branchB.id,
          contextFor(branchA.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('rejects a sub-unit coordinator targeting the org root/HQ unit', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { root, branchA } = await setupOrgTree();

      await expect(
        mutationResolver.setReimbursementRate(
          reimbursementType.id,
          2_000,
          root.id,
          contextFor(branchA.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('allows a caller to set a rate on their own unit', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA } = await setupOrgTree();

      const rate = await mutationResolver.setReimbursementRate(
        reimbursementType.id,
        2_000,
        branchA.id,
        contextFor(branchA.id),
      );
      expect(rate.hourlyRateCents).toBe(2_000);
    });

    it('allows a caller to set a rate on a descendant of their own unit', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA, branchASub } = await setupOrgTree();

      const rate = await mutationResolver.setReimbursementRate(
        reimbursementType.id,
        2_000,
        branchASub.id,
        contextFor(branchA.id),
      );
      expect(rate.hourlyRateCents).toBe(2_000);
    });
  });

  describe('effectiveRates', () => {
    it('rejects a caller passing an unrelated branch as organizationUnitId', async () => {
      const { branchA, branchB } = await setupOrgTree();

      await expect(
        queryResolver.effectiveRates(branchB.id, contextFor(branchA.id)),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('allows a caller to query their own descendant unit', async () => {
      const { branchA, branchASub } = await setupOrgTree();

      await expect(
        queryResolver.effectiveRates(branchASub.id, contextFor(branchA.id)),
      ).resolves.toBeDefined();
    });
  });

  describe('rosterYearlyUsage', () => {
    it('rejects a caller targeting a sibling branch', async () => {
      const { branchA, branchB } = await setupOrgTree();

      await expect(
        queryResolver.rosterYearlyUsage(
          branchB.id,
          2026,
          contextFor(branchA.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('rejects a sub-unit coordinator targeting the org root/HQ unit', async () => {
      const { root, branchA } = await setupOrgTree();

      await expect(
        queryResolver.rosterYearlyUsage(root.id, 2026, contextFor(branchA.id)),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('allows a caller to query their own unit', async () => {
      const { branchA } = await setupOrgTree();

      await expect(
        queryResolver.rosterYearlyUsage(
          branchA.id,
          2026,
          contextFor(branchA.id),
        ),
      ).resolves.toBeDefined();
    });
  });
});
