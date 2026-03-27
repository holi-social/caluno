import { inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { PERMISSIONS } from '../auth/constants';
import { permissions } from '../auth/schemas/permission.schema';
import * as schema from './schema';

const PERMISSION_NAMES: Record<
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  string
> = {
  [PERMISSIONS.ORG_CREATE]: 'Create organization',
  [PERMISSIONS.ORG_READ]: 'Read organization',
  [PERMISSIONS.ORG_UPDATE]: 'Update organization',
  [PERMISSIONS.ORG_DELETE]: 'Delete organization',
  [PERMISSIONS.ORG_UNIT_CREATE]: 'Create organization unit',
  [PERMISSIONS.ORG_UNIT_READ]: 'Read organization unit',
  [PERMISSIONS.ORG_UNIT_UPDATE]: 'Update organization unit',
  [PERMISSIONS.ORG_UNIT_DELETE]: 'Delete organization unit',
  [PERMISSIONS.ROLE_CREATE]: 'Create role',
  [PERMISSIONS.ROLE_READ]: 'Read role',
  [PERMISSIONS.ROLE_UPDATE]: 'Update role',
  [PERMISSIONS.ROLE_DELETE]: 'Delete role',
  [PERMISSIONS.MEMBERSHIP_CREATE]: 'Create membership',
  [PERMISSIONS.MEMBERSHIP_READ]: 'Read membership',
  [PERMISSIONS.MEMBERSHIP_UPDATE]: 'Update membership',
  [PERMISSIONS.MEMBERSHIP_DELETE]: 'Delete membership',
  [PERMISSIONS.MEMBERSHIP_REQUEST_READ]: 'Read membership request',
  [PERMISSIONS.MEMBERSHIP_REQUEST_UPDATE]: 'Update membership request',
  [PERMISSIONS.MEMBERSHIP_REQUEST_DELETE]: 'Delete membership request',
  [PERMISSIONS.MEMBERSHIP_REQUEST_APPROVE]: 'Approve membership request',
  [PERMISSIONS.MEMBERSHIP_REQUEST_REJECT]: 'Reject membership request',
  [PERMISSIONS.MEMBERSHIP_REQUEST_CANCEL]: 'Cancel membership request',
  [PERMISSIONS.SHIFT_CREATE]: 'Create shift',
  [PERMISSIONS.SHIFT_READ]: 'Read shift',
  [PERMISSIONS.SHIFT_UPDATE]: 'Update shift',
  [PERMISSIONS.SHIFT_DELETE]: 'Delete shift',
  [PERMISSIONS.TIME_ENTRY_CREATE]: 'Create time entry',
  [PERMISSIONS.TIME_ENTRY_READ]: 'Read time entry',
  [PERMISSIONS.TIME_ENTRY_UPDATE]: 'Update time entry',
  [PERMISSIONS.TIME_ENTRY_DELETE]: 'Delete time entry',
};

async function seed() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: false,
  });

  const db = drizzle({ client: pool, schema, casing: 'snake_case' });

  const values = Object.values(PERMISSIONS).map((key) => ({
    key,
    description: PERMISSION_NAMES[key],
  }));

  const validKeys = Object.values(PERMISSIONS);
  const existing = await db
    .select({
      key: permissions.key,
      description: permissions.description,
    })
    .from(permissions);
  const existingByKey = new Map(existing.map((permission) => [permission.key, permission]));

  const insertedKeys = values
    .filter(({ key }) => !existingByKey.has(key))
    .map(({ key }) => key);
  const updatedDescriptionKeys = values
    .filter(({ key, description }) => {
      const current = existingByKey.get(key);
      return Boolean(current && current.description !== description);
    })
    .map(({ key }) => key);

  const staleKeys = existing
    .map((p) => p.key)
    .filter((key) => !validKeys.includes(key as (typeof validKeys)[number]));

  await db.transaction(async (tx) => {
    if (staleKeys.length > 0) {
      await tx.delete(schema.rolePermissions).where(
        inArray(
          schema.rolePermissions.permissionId,
          tx
            .select({ id: permissions.id })
            .from(permissions)
            .where(inArray(permissions.key, staleKeys)),
        ),
      );
      await tx.delete(permissions).where(inArray(permissions.key, staleKeys));
      console.log(
        `Removed ${staleKeys.length} stale permissions: ${staleKeys.join(', ')}`,
      );
    }

    await tx
      .insert(permissions)
      .values(values)
      .onConflictDoUpdate({
        target: permissions.key,
        set: {
          description: sql`excluded.description`,
        },
      });
  });

  console.log(`Inserted ${insertedKeys.length} new permissions`);
  console.log(`Updated ${updatedDescriptionKeys.length} permission descriptions`);
  console.log(`Synced ${values.length} permissions in total`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
