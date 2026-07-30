import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { AuthService } from '../src/auth/auth.service';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import * as schema from '../src/database/schema';
import { NotFoundGraphQLError } from '../src/graphql/errors';
import { MembershipService } from '../src/membership/membership.service';
import { NotificationService } from '../src/notification';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementProfileService } from '../src/requirement-profile/services/requirement-profile.service';
import { createUser } from './factories';
import {
  addMembership,
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('MembershipService', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let service: MembershipService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);
    service = new MembershipService(
      db,
      {} as RequirementProfileService,
      {} as AuthService,
      {} as NotificationService,
      {} as RequiredFormService,
    );
    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  describe('leaveMembership', () => {
    it('deletes the current user membership and returns true', async () => {
      const user = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Leave Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, user.id, unit.id);
      expect(membership).toBeTruthy();

      const result = await service.leaveMembership(membership.id, user.id);

      expect(result).toBe(true);
      const after = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.id, membership.id));
      expect(after).toEqual([]);
    });

    it('is self-scoped: another user cannot delete it and throws NotFound', async () => {
      const owner = await createUser(db);
      const other = await createUser(db);
      const { organization, type } = await createOrganizationWithType(
        db,
        `Scope Org ${crypto.randomUUID()}`,
      );
      const unit = await createUnit(db, {
        organizationId: organization.id,
        typeId: type.id,
        name: 'unit',
      });
      const membership = await addMembership(db, owner.id, unit.id);

      await expect(
        service.leaveMembership(membership.id, other.id),
      ).rejects.toBeInstanceOf(NotFoundGraphQLError);

      const stillThere = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(eq(schema.memberships.id, membership.id));
      expect(stillThere.length).toBe(1);
    });
  });
});
