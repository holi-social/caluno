import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import {
  DocumentKind,
  InvoiceStatus,
  SigneeType,
} from '../src/accounting/enums';
import { ReimbursementTypeMapper } from '../src/accounting/mappers';
import { ReimbursementRateMapper } from '../src/accounting/mappers/reimbursement-rate.mapper';
import { ReimbursementMutationResolver } from '../src/accounting/resolvers/reimbursement-mutation.resolver';
import { ReimbursementQueryResolver } from '../src/accounting/resolvers/reimbursement-query.resolver';
import { ReimbursementRateService } from '../src/accounting/services/reimbursement-rate.service';
import type { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import {
  BadRequestGraphQLError,
  NotFoundGraphQLError,
} from '../src/graphql/errors';
import type { AuthenticatedGraphQLContext } from '../src/graphql/graphql.context';
import { MembershipService } from '../src/membership/membership.service';
import type { NotificationService } from '../src/notification';
import { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { OrganizationUnitDataModule } from '../src/organization/organization-unit-data.module';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import type { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import type { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import type { FileService } from '../src/storage/services/file.service';
import { UserMapper } from '../src/user/mappers/user.mapper';
import { UserService } from '../src/user/user.service';
import {
  createDocumentTemplate,
  createReimbursementType,
} from './factories/accounting.factory';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createUser } from './factories/user.factory';
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
      { capture: () => {} } as unknown as PostHogService,
    );
    const membershipService = new MembershipService(
      db,
      {} as RequirementProfileService,
      {} as AuthService,
      {} as NotificationService,
      {} as RequiredFormService,
      { capture: () => {} } as unknown as PostHogService,
    );
    const reimbursementRateService = new ReimbursementRateService(
      db,
      organizationUnitDataService,
      membershipService,
      { capture: () => {} } as unknown as PostHogService,
    );
    const userService = new UserService(db, { capture: () => {} } as unknown as PostHogService);
    queryResolver = new ReimbursementQueryResolver(
      reimbursementRateService,
      new ReimbursementTypeMapper(),
      organizationUnitService,
      new UserMapper(),
      membershipService,
      userService,
    );
    mutationResolver = new ReimbursementMutationResolver(
      reimbursementRateService,
      new ReimbursementRateMapper(),
      organizationUnitService,
      membershipService,
      new UserMapper(),
      new ReimbursementTypeMapper(),
      userService,
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

  describe('bundleDownloadStatus / recordBundleDownload — scope check', () => {
    const sessionFor = (userId: string): UserSession =>
      ({ user: { id: userId } }) as UserSession;

    it("rejects recording a download for a volunteer outside the caller's org subtree", async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA, branchB } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchB.id);
      const caller = await createUser(db);

      await expect(
        mutationResolver.recordBundleDownload(
          volunteer.id,
          reimbursementType.id,
          undefined,
          contextFor(branchA.id),
          sessionFor(caller.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it("allows recording a download for a volunteer within the caller's org subtree", async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA, branchASub } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchASub.id);
      const caller = await createUser(db);

      const result = await mutationResolver.recordBundleDownload(
        volunteer.id,
        reimbursementType.id,
        undefined,
        contextFor(branchA.id),
        sessionFor(caller.id),
      );

      expect(result.downloadedByUser?.id).toBe(caller.id);
      expect(result.volunteer.id).toBe(volunteer.id);
    });

    it('returns null bundleDownloadStatus for a pair that has never been downloaded', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchA.id);

      const result = await queryResolver.bundleDownloadStatus(
        volunteer.id,
        reimbursementType.id,
        contextFor(branchA.id),
      );

      expect(result).toBeNull();
    });

    it("rejects querying bundleDownloadStatus for a volunteer outside the caller's org subtree", async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { branchA, branchB } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchB.id);

      await expect(
        queryResolver.bundleDownloadStatus(
          volunteer.id,
          reimbursementType.id,
          contextFor(branchA.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it('marks the passed invoiceIds paid when recording a download', async () => {
      const reimbursementType = await createReimbursementType(db, {
        platformDefaultRateCents: 1_500,
      });
      const { organization, branchA, branchASub } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchASub.id);
      const caller = await createUser(db);
      const template = await createDocumentTemplate(db, {
        organizationId: organization.id,
        reimbursementTypeId: reimbursementType.id,
        kind: DocumentKind.INVOICE,
        signees: [{ order: 0, signeeType: SigneeType.VOLUNTEER }],
      });
      const [invoice] = await db
        .insert(schema.invoices)
        .values({
          documentTemplateId: template.id,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date('2026-03-01T00:00:00.000Z'),
          periodEnd: new Date('2026-03-01T00:00:00.000Z'),
          totalAmountCents: 10_000,
          totalHours: 1,
          resolvedBody: { header: {}, blocks: [], footer: {} },
          invoiceStatus: InvoiceStatus.READY,
        })
        .returning();

      await mutationResolver.recordBundleDownload(
        volunteer.id,
        reimbursementType.id,
        [invoice.id],
        contextFor(branchA.id),
        sessionFor(caller.id),
      );

      const updated = await db.query.invoices.findFirst({
        where: { id: invoice.id },
      });
      expect(updated?.paidAt).not.toBeNull();
      expect(updated?.paidByUserId).toBe(caller.id);
    });
  });

  describe('manualBaseline / setManualBaseline — scope check', () => {
    const sessionFor = (userId: string): UserSession =>
      ({ user: { id: userId } }) as UserSession;

    it("rejects setting a baseline for a volunteer outside the caller's org subtree", async () => {
      const reimbursementType = await createReimbursementType(db);
      const { branchA, branchB } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchB.id);
      const caller = await createUser(db);

      await expect(
        mutationResolver.setManualBaseline(
          volunteer.id,
          reimbursementType.id,
          2026,
          10_000,
          contextFor(branchA.id),
          sessionFor(caller.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });

    it("allows setting a baseline for a volunteer within the caller's org subtree", async () => {
      const reimbursementType = await createReimbursementType(db);
      const { branchA, branchASub } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchASub.id);
      const caller = await createUser(db);

      const result = await mutationResolver.setManualBaseline(
        volunteer.id,
        reimbursementType.id,
        2026,
        10_000,
        contextFor(branchA.id),
        sessionFor(caller.id),
      );

      expect(result.amountCents).toBe(10_000);
      expect(result.updatedByUser?.id).toBe(caller.id);
      expect(result.volunteer.id).toBe(volunteer.id);
    });

    it('rejects a negative amount', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { branchA, branchASub } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchASub.id);
      const caller = await createUser(db);

      await expect(
        mutationResolver.setManualBaseline(
          volunteer.id,
          reimbursementType.id,
          2026,
          -500,
          contextFor(branchA.id),
          sessionFor(caller.id),
        ),
      ).rejects.toBeInstanceOf(BadRequestGraphQLError);
    });

    it('returns null manualBaseline for a pair with no baseline set yet', async () => {
      const reimbursementType = await createReimbursementType(db);
      const { branchA } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchA.id);

      const result = await queryResolver.manualBaseline(
        volunteer.id,
        reimbursementType.id,
        2026,
        contextFor(branchA.id),
      );

      expect(result).toBeNull();
    });

    it("rejects querying manualBaseline for a volunteer outside the caller's org subtree", async () => {
      const reimbursementType = await createReimbursementType(db);
      const { branchA, branchB } = await setupOrgTree();
      const volunteer = await createUser(db);
      await addMembership(db, volunteer.id, branchB.id);

      await expect(
        queryResolver.manualBaseline(
          volunteer.id,
          reimbursementType.id,
          2026,
          contextFor(branchA.id),
        ),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);
    });
  });
});
