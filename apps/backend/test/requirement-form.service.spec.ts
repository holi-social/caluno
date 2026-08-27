import 'reflect-metadata';
import { beforeAll, describe, expect, it } from 'bun:test';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { type Database, DatabaseModule } from '../src/database/database.module';
import { DATABASE_CONNECTION } from '../src/database/database-connection';
import { BadRequestGraphQLError } from '../src/graphql/errors';
import { RequiredFormService } from '../src/requirement-profile/services/required-form.service';
import { RequirementFormService } from '../src/requirement-profile/services/requirement-form.service';
import { createUser } from './factories';
import {
  createOrganizationWithType,
  createUnit,
} from './factories/org.factory';
import { createRequirementForm } from './factories/requirement-form.factory';
import {
  ensureTestDatabase,
  registerTestResourceCleanup,
} from './helpers/ensure-test-database';

describe('RequirementFormService block org scoping', () => {
  let moduleRef: TestingModule;
  let db: Database;
  let requirementFormService: RequirementFormService;

  beforeAll(async () => {
    await ensureTestDatabase();
    moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
    }).compile();
    db = moduleRef.get<Database>(DATABASE_CONNECTION);

    requirementFormService = new RequirementFormService(
      db,
      new RequiredFormService(db),
    );

    registerTestResourceCleanup(async () => {
      await moduleRef.close();
    });
  });

  const setupOrg = async (label: string) => {
    const user = await createUser(db);
    const { organization, type } = await createOrganizationWithType(
      db,
      `${label} ${crypto.randomUUID()}`,
    );
    const unit = await createUnit(db, {
      organizationId: organization.id,
      typeId: type.id,
      name: 'root',
    });
    return { user, organization, type, unit };
  };

  it('create attaches blocks from the same organization', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');
    const { block } = await createRequirementForm(db, {
      organizationId: organization.id,
      organizationUnitId: unit.id,
      createdById: user.id,
    });

    const form = await requirementFormService.create(
      {
        organizationId: organization.id,
        name: 'Scoped form',
        blockRefs: [{ blockId: block.id, order: 0 }],
      },
      unit.id,
      user.id,
    );

    const refs = await db.query.requirementFormBlockRefs.findMany({
      where: { formId: form.id },
    });
    expect(refs.map((r) => r.blockId)).toEqual([block.id]);
  });

  it('create rejects blocks from another organization', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');
    const other = await setupOrg('Other Org');
    const { block: otherBlock } = await createRequirementForm(db, {
      organizationId: other.organization.id,
      organizationUnitId: other.unit.id,
      createdById: other.user.id,
    });

    await expect(
      requirementFormService.create(
        {
          organizationId: organization.id,
          name: 'Cross-org form',
          blockRefs: [{ blockId: otherBlock.id, order: 0 }],
        },
        unit.id,
        user.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestGraphQLError);
  });

  it('update rejects attaching blocks from another organization', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');
    const other = await setupOrg('Other Org');
    const { form } = await createRequirementForm(db, {
      organizationId: organization.id,
      organizationUnitId: unit.id,
      createdById: user.id,
    });
    const { block: otherBlock } = await createRequirementForm(db, {
      organizationId: other.organization.id,
      organizationUnitId: other.unit.id,
      createdById: other.user.id,
    });

    await expect(
      requirementFormService.update(
        form.id,
        unit.id,
        { blockRefs: [{ blockId: otherBlock.id, order: 0 }] },
        user.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestGraphQLError);

    // The rejected update must not have replaced the existing refs
    const refs = await db.query.requirementFormBlockRefs.findMany({
      where: { formId: form.id },
    });
    expect(refs.some((r) => r.blockId === otherBlock.id)).toBe(false);
  });

  it('update attaches blocks from the same organization', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');
    const { form } = await createRequirementForm(db, {
      organizationId: organization.id,
      organizationUnitId: unit.id,
      createdById: user.id,
    });
    const { block: ownBlock } = await createRequirementForm(db, {
      organizationId: organization.id,
      organizationUnitId: unit.id,
      createdById: user.id,
      name: 'Second form',
    });

    await requirementFormService.update(
      form.id,
      unit.id,
      { blockRefs: [{ blockId: ownBlock.id, order: 0 }] },
      user.id,
    );

    const refs = await db.query.requirementFormBlockRefs.findMany({
      where: { formId: form.id },
    });
    expect(refs.map((r) => r.blockId)).toEqual([ownBlock.id]);
  });

  it('rejects unknown block ids', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');

    await expect(
      requirementFormService.create(
        {
          organizationId: organization.id,
          name: 'Unknown block form',
          blockRefs: [{ blockId: crypto.randomUUID(), order: 0 }],
        },
        unit.id,
        user.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestGraphQLError);
  });

  it('update rejects empty block refs', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');
    const { form } = await createRequirementForm(db, {
      organizationId: organization.id,
      organizationUnitId: unit.id,
      createdById: user.id,
    });

    await expect(
      requirementFormService.update(
        form.id,
        unit.id,
        { blockRefs: [] },
        user.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestGraphQLError);
  });

  it('update rejects null block refs', async () => {
    const { user, organization, unit } = await setupOrg('Form Org');
    const { form } = await createRequirementForm(db, {
      organizationId: organization.id,
      organizationUnitId: unit.id,
      createdById: user.id,
    });

    await expect(
      requirementFormService.update(
        form.id,
        unit.id,
        { blockRefs: null },
        user.id,
      ),
    ).rejects.toBeInstanceOf(BadRequestGraphQLError);
  });
});
