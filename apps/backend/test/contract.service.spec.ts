import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  ContractStatus,
  DocumentKind,
  DocumentStatusChange,
  SigneeType,
} from '../src/accounting/enums';
import { ContractService } from '../src/accounting/services/contract.service';
import { DocumentSigningService } from '../src/accounting/services/document-signing.service';
import { DocumentTemplateService } from '../src/accounting/services/document-template.service';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import {
  ConflictGraphQLError,
  ForbiddenGraphQLError,
} from '../src/graphql/errors';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification';
import { OrganizationMapper } from '../src/organization/mappers/organization.mapper';
import { OrganizationService } from '../src/organization/organization.service';
import { OrganizationUnitService } from '../src/organization/organization-unit.service';
import { OrganizationUnitDataService } from '../src/organization/organization-unit-data.service';
import { PostHogService } from '../src/shared/observability/posthog.service';
import { FileService } from '../src/storage/services/file.service';
import {
  createReimbursementType,
  createTwoStepTemplate,
} from './factories/accounting.factory';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  assignRoleToMembership,
  createPermission,
  createRole,
  grantPermissionToRole,
} from './factories/role.factory';
import { createUser } from './factories/user.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('ContractService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: ContractService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    const organizationUnitDataService = new OrganizationUnitDataService(db);
    const authService = new AuthService(db, organizationUnitDataService);
    const organizationService = new OrganizationService(
      db,
      {} as OrganizationMapper,
      {} as MembershipService,
      {} as OrganizationUnitService,
      {} as NotificationService,
      {} as FileService,
      {} as PostHogService,
    );
    const documentTemplateService = new DocumentTemplateService(db);
    const documentSigningService = new DocumentSigningService(
      db,
      authService,
      organizationService,
    );
    service = new ContractService(
      db,
      documentTemplateService,
      documentSigningService,
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  /** Org + root unit + a volunteer -> permission-holder contract template, with one authorized signer. */
  const setup = async () => {
    const reimbursementType = await createReimbursementType(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `Contract Org ${crypto.randomUUID()}`,
    );
    const root = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    const permission = await createPermission(db, {
      key: `accounting:manage:${crypto.randomUUID()}`,
    });
    const role = await createRole(db, { organizationId: organization.id });
    await grantPermissionToRole(db, {
      roleId: role.id,
      permissionId: permission.id,
    });
    const signer = await createUser(db);
    const signerMembership = await addMembership(db, signer.id, root.id);
    await assignRoleToMembership(db, {
      membershipId: signerMembership.id,
      roleId: role.id,
    });
    const template = await createTwoStepTemplate(db, {
      organizationId: organization.id,
      reimbursementTypeId: reimbursementType.id,
      kind: DocumentKind.CONTRACT,
      requiredPermissionId: permission.id,
      signeeTypes: [SigneeType.VOLUNTEER, SigneeType.PERMISSION_HOLDER],
    });
    const volunteer = await createUser(db);

    return { organization, reimbursementType, template, signer, volunteer };
  };

  describe('createContract', () => {
    it('starts at the first signee step and records a CREATED event', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();

      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date('2026-01-01T00:00:00.000Z'),
          periodEnd: new Date('2026-12-31T00:00:00.000Z'),
        },
        signer.id,
      );

      expect(contract.contractStatus).toBe(
        ContractStatus.AWAITING_VOLUNTEER_SIGNATURE,
      );

      const statusChanges = await service.findContractStatusChanges(
        contract.id,
      );
      expect(statusChanges).toHaveLength(1);
      expect(statusChanges[0].type).toBe(DocumentStatusChange.CREATED);
    });

    it('snapshots the template body onto the contract', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();

      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        signer.id,
      );

      expect(contract.resolvedBody).toEqual({
        header: {},
        blocks: [],
        footer: {},
      });
    });
  });

  describe('signContract', () => {
    it('walks the contract through the full signing chain to ACTIVE', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        signer.id,
      );

      const afterVolunteer = await service.signContract(
        contract.id,
        volunteer.id,
      );
      expect(afterVolunteer.contractStatus).toBe(
        ContractStatus.AWAITING_NGO_SIGNATURE,
      );

      const afterCountersign = await service.signContract(
        contract.id,
        signer.id,
      );
      expect(afterCountersign.contractStatus).toBe(ContractStatus.ACTIVE);

      const statusChanges = await service.findContractStatusChanges(
        contract.id,
      );
      expect(statusChanges.map((e) => e.type)).toEqual([
        DocumentStatusChange.CREATED,
        DocumentStatusChange.SIGNED,
        DocumentStatusChange.COUNTERSIGNED,
        DocumentStatusChange.ACTIVATED,
      ]);
    });

    it('forbids a user who is not the volunteer from signing the first step', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        signer.id,
      );

      await expect(
        service.signContract(contract.id, signer.id),
      ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
    });

    it('throws ConflictGraphQLError when signing a contract that is already ACTIVE', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        signer.id,
      );
      await service.signContract(contract.id, volunteer.id);
      await service.signContract(contract.id, signer.id);

      await expect(
        service.signContract(contract.id, signer.id),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });
  });

  describe('declineContract', () => {
    it('requires a non-empty reason', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        signer.id,
      );

      await expect(
        service.declineContract(contract.id, volunteer.id, '   '),
      ).rejects.toThrow();
    });

    it('records the decline reason, actor and signee type', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        signer.id,
      );

      const declined = await service.declineContract(
        contract.id,
        volunteer.id,
        'Terms are not acceptable',
      );

      expect(declined.contractStatus).toBe(ContractStatus.DECLINED);
      expect(declined.declineReason).toBe('Terms are not acceptable');
      expect(declined.declinedByUserId).toBe(volunteer.id);
      expect(declined.declinedAtSigneeType).toBe(SigneeType.VOLUNTEER);

      const statusChanges = await service.findContractStatusChanges(
        contract.id,
      );
      expect(statusChanges.at(-1)?.type).toBe(DocumentStatusChange.DECLINED);
    });
  });

  describe('findActiveContract', () => {
    it('ignores an ACTIVE contract whose period has already ended', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date('2020-01-01T00:00:00.000Z'),
          periodEnd: new Date('2020-12-31T00:00:00.000Z'),
        },
        signer.id,
      );
      await service.signContract(contract.id, volunteer.id);
      await service.signContract(contract.id, signer.id);

      const active = await service.findActiveContract(
        volunteer.id,
        reimbursementType.id,
      );
      expect(active).toBeUndefined();
    });

    it('finds an ACTIVE contract whose period covers today', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const contract = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date(Date.now() - 86_400_000),
          periodEnd: new Date(Date.now() + 86_400_000),
        },
        signer.id,
      );
      await service.signContract(contract.id, volunteer.id);
      await service.signContract(contract.id, signer.id);

      const active = await service.findActiveContract(
        volunteer.id,
        reimbursementType.id,
      );
      expect(active?.id).toBe(contract.id);
    });
  });

  describe('findContractsForOrganization', () => {
    it('only returns contracts scoped to the given organization', async () => {
      const first = await setup();
      const second = await setup();

      const firstContract = await service.createContract(
        first.organization.id,
        {
          organizationUnitId: null,
          volunteerId: first.volunteer.id,
          reimbursementTypeId: first.reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        first.signer.id,
      );
      await service.createContract(
        second.organization.id,
        {
          organizationUnitId: null,
          volunteerId: second.volunteer.id,
          reimbursementTypeId: second.reimbursementType.id,
          periodStart: new Date(),
          periodEnd: new Date(),
        },
        second.signer.id,
      );

      const results = await service.findContractsForOrganization(
        first.organization.id,
      );
      expect(results.map((c) => c.id)).toEqual([firstContract.id]);
    });

    it('excludes contracts whose period does not overlap the requested range', async () => {
      const { organization, reimbursementType, volunteer, signer } =
        await setup();
      const secondVolunteer = await createUser(db);

      const inRange = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: volunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date('2026-03-01'),
          periodEnd: new Date('2026-03-31'),
        },
        signer.id,
      );
      const outOfRange = await service.createContract(
        organization.id,
        {
          organizationUnitId: null,
          volunteerId: secondVolunteer.id,
          reimbursementTypeId: reimbursementType.id,
          periodStart: new Date('2026-06-01'),
          periodEnd: new Date('2026-06-30'),
        },
        signer.id,
      );

      const results = await service.findContractsForOrganization(
        organization.id,
        {
          periodStart: new Date('2026-01-01'),
          periodEnd: new Date('2026-04-01'),
        },
      );

      const ids = results.map((c) => c.id);
      expect(ids).toContain(inRange.id);
      expect(ids).not.toContain(outOfRange.id);
    });
  });
});
