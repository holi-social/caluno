import { type Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { slugify } from '../../src/utils/slug.util';

type UnitEntity = typeof schema.organizationUnits.$inferSelect;

export const createOrganizationWithType = async (
  db: Database,
  name: string,
) => {
  const [organization] = await db
    .insert(schema.organizations)
    .values({ name, slug: slugify(name) })
    .returning();
  const [type] = await db
    .insert(schema.organizationUnitTypes)
    .values({
      organizationId: organization.id,
      name: `${name}-type`,
      icon: 'building-2',
    })
    .returning();
  return { organization, type };
};

export const createUnit = async (
  db: Database,
  args: {
    organizationId: string;
    typeId: string;
    name: string;
    parentId?: string | null;
    deletedAt?: Date | null;
  },
): Promise<UnitEntity> => {
  const [unit] = await db
    .insert(schema.organizationUnits)
    .values({
      organizationId: args.organizationId,
      typeId: args.typeId,
      name: args.name,
      slug: slugify(args.name),
      parentId: args.parentId ?? null,
      deletedAt: args.deletedAt ?? null,
    })
    .returning();
  if (!unit) throw new Error('Failed to create organization unit');
  return unit;
};

export const addMembership = async (
  db: Database,
  userId: string,
  organizationUnitId: string,
) => {
  const [membership] = await db
    .insert(schema.memberships)
    .values({ userId, organizationUnitId })
    .returning();
  if (!membership) throw new Error('Failed to create membership');
  return membership;
};
