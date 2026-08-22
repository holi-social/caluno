import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { SigneeType } from '../src/accounting/enums';
import { DocumentSigningService } from '../src/accounting/services/document-signing.service';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import {
  BadRequestGraphQLError,
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
import { createUser } from './factories';
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
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('DocumentSigningService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: DocumentSigningService;

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
    service = new DocumentSigningService(db, authService, organizationService);

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('orderSignatures', () => {
    it('sorts signatures by order regardless of input order', () => {
      const signatures = [
        { order: 2, signedAt: null },
        { order: 0, signedAt: null },
        { order: 1, signedAt: null },
      ];
      expect(service.orderSignatures(signatures).map((s) => s.order)).toEqual([
        0, 1, 2,
      ]);
    });
  });

  describe('assertAwaitingSignature', () => {
    it('does not throw when status is in the awaiting list', () => {
      expect(() =>
        service.assertAwaitingSignature('AWAITING_VOLUNTEER_SIGNATURE', [
          'AWAITING_VOLUNTEER_SIGNATURE',
          'AWAITING_NGO_SIGNATURE',
        ]),
      ).not.toThrow();
    });

    it('throws ConflictGraphQLError when status is not awaiting', () => {
      expect(() =>
        service.assertAwaitingSignature('ACTIVE', [
          'AWAITING_VOLUNTEER_SIGNATURE',
        ]),
      ).toThrow(ConflictGraphQLError);
    });
  });

  describe('assertPendingSignature', () => {
    it('returns the signature at the pending index', () => {
      const signatures = [{ order: 0, signedAt: null, id: 'a' }];
      expect(service.assertPendingSignature(0, signatures)).toEqual(
        signatures[0],
      );
    });

    it('throws ConflictGraphQLError when there is no pending index', () => {
      expect(() => service.assertPendingSignature(-1, [])).toThrow(
        ConflictGraphQLError,
      );
    });
  });

  describe('assertReason', () => {
    it('does not throw for a non-empty reason', () => {
      expect(() => service.assertReason('Missing documents')).not.toThrow();
    });

    it('throws BadRequestGraphQLError for an empty or whitespace-only reason', () => {
      expect(() => service.assertReason('')).toThrow(BadRequestGraphQLError);
      expect(() => service.assertReason('   ')).toThrow(BadRequestGraphQLError);
    });
  });

  describe('organizationIdOf', () => {
    it('returns the organizationId of the template', () => {
      expect(
        service.organizationIdOf({
          organizationId: 'org-1',
        } as never),
      ).toBe('org-1');
    });

    it('throws ConflictGraphQLError when the template is null', () => {
      expect(() => service.organizationIdOf(null)).toThrow(
        ConflictGraphQLError,
      );
    });
  });

  describe('assertSigneeAuthorized', () => {
    it('allows the matching volunteer to sign at a VOLUNTEER step', async () => {
      const volunteer = await createUser(db);
      await expect(
        service.assertSigneeAuthorized(
          volunteer.id,
          volunteer.id,
          SigneeType.VOLUNTEER,
          null,
          'unused-org-id',
        ),
      ).resolves.toBeUndefined();
    });

    it('forbids any other user at a VOLUNTEER step', async () => {
      const volunteer = await createUser(db);
      const other = await createUser(db);
      await expect(
        service.assertSigneeAuthorized(
          other.id,
          volunteer.id,
          SigneeType.VOLUNTEER,
          null,
          'unused-org-id',
        ),
      ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
    });

    it('allows a user holding the required permission at the org root unit to sign', async () => {
      const { organization, type } = await createOrganizationWithType(
        db,
        `Signing Org ${crypto.randomUUID()}`,
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
      const membership = await addMembership(db, signer.id, root.id);
      await assignRoleToMembership(db, {
        membershipId: membership.id,
        roleId: role.id,
      });
      const volunteer = await createUser(db);

      await expect(
        service.assertSigneeAuthorized(
          signer.id,
          volunteer.id,
          SigneeType.PERMISSION_HOLDER,
          permission.id,
          organization.id,
        ),
      ).resolves.toBeUndefined();
    });

    it('forbids a user without the required permission', async () => {
      const { organization, type } = await createOrganizationWithType(
        db,
        `Signing Org No Perm ${crypto.randomUUID()}`,
      );
      await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'root',
      });
      const permission = await createPermission(db, {
        key: `accounting:manage:${crypto.randomUUID()}`,
      });
      const bystander = await createUser(db);
      const volunteer = await createUser(db);

      await expect(
        service.assertSigneeAuthorized(
          bystander.id,
          volunteer.id,
          SigneeType.PERMISSION_HOLDER,
          permission.id,
          organization.id,
        ),
      ).rejects.toBeInstanceOf(ForbiddenGraphQLError);
    });

    it('throws ConflictGraphQLError when the permission-holder step has no required permission', async () => {
      const volunteer = await createUser(db);
      const signer = await createUser(db);
      await expect(
        service.assertSigneeAuthorized(
          signer.id,
          volunteer.id,
          SigneeType.PERMISSION_HOLDER,
          null,
          'org-1',
        ),
      ).rejects.toBeInstanceOf(ConflictGraphQLError);
    });
  });

  describe('resolvePendingSignee', () => {
    it('returns null when every signature is already signed', async () => {
      const result = await service.resolvePendingSignee(
        [
          { order: 0, signedAt: new Date(), signeeType: SigneeType.VOLUNTEER },
        ] as never,
        'volunteer-1',
        'org-1',
      );
      expect(result).toBeNull();
    });

    it('resolves a pending VOLUNTEER signee', async () => {
      const result = await service.resolvePendingSignee(
        [
          { order: 0, signedAt: null, signeeType: SigneeType.VOLUNTEER },
        ] as never,
        'volunteer-1',
        'org-1',
      );
      expect(result).toEqual({
        signeeType: SigneeType.VOLUNTEER,
        userId: 'volunteer-1',
      });
    });

    it('resolves a pending PERMISSION_HOLDER signee with eligible users', async () => {
      const { organization, type } = await createOrganizationWithType(
        db,
        `Pending Signee Org ${crypto.randomUUID()}`,
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
      const membership = await addMembership(db, signer.id, root.id);
      await assignRoleToMembership(db, {
        membershipId: membership.id,
        roleId: role.id,
      });
      const volunteer = await createUser(db);

      const result = await service.resolvePendingSignee(
        [
          {
            order: 0,
            signedAt: null,
            signeeType: SigneeType.PERMISSION_HOLDER,
            requiredPermissionId: permission.id,
          },
        ] as never,
        volunteer.id,
        organization.id,
      );

      expect(result).toEqual({
        signeeType: SigneeType.PERMISSION_HOLDER,
        permissionKey: permission.key,
        eligibleUserIds: [signer.id],
      });
    });
  });
});
