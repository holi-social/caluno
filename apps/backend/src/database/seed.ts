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
  [PERMISSIONS.ORG_VIEW]: 'View organization',
  [PERMISSIONS.ORG_EDIT]: 'Edit organization',
  [PERMISSIONS.VOLUNTEER_VIEW]: 'View volunteer',
  [PERMISSIONS.VOLUNTEER_EDIT]: 'Edit volunteer',
  [PERMISSIONS.SHIFT_VIEW]: 'View shift',
  [PERMISSIONS.SHIFT_EDIT]: 'Edit shift',
  [PERMISSIONS.REQUIREMENT_PROFILE_VIEW]: 'View requirement profile',
  [PERMISSIONS.REQUIREMENT_PROFILE_EDIT]: 'Edit requirement profile',
  [PERMISSIONS.ACCOUNTING_MANAGE]: 'Manage accounting',
  [PERMISSIONS.CHECK_IN_MANAGE]: 'Manage check-in',
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

  const db = drizzle({ client: pool });

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
  const existingByKey = new Map(
    existing.map((permission) => [permission.key, permission]),
  );

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
      await tx
        .delete(schema.rolePermissions)
        .where(
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
  console.log(
    `Updated ${updatedDescriptionKeys.length} permission descriptions`,
  );
  console.log(`Synced ${values.length} permissions in total`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
