import { inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ReimbursementTypeKey } from '../accounting/enums';
import { reimbursementTypes } from '../accounting/schemas/reimbursement-type.schema';
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
};

// The two statutory Pauschale types this feature is built around — fixed by
// law, not org-configurable, and there is no mutation to create them, so
// they must exist as reference data in every environment.
const REIMBURSEMENT_TYPES: Array<
  Pick<
    typeof reimbursementTypes.$inferInsert,
    'key' | 'legalReference' | 'yearlyLimitCents' | 'platformDefaultRateCents'
  >
> = [
  {
    key: ReimbursementTypeKey.EHRENAMT,
    legalReference: '§3 Nr. 26a EStG',
    yearlyLimitCents: 84_000,
    platformDefaultRateCents: 500,
  },
  {
    key: ReimbursementTypeKey.UEBUNGSLEITER,
    legalReference: '§3 Nr. 26 EStG',
    yearlyLimitCents: 300_000,
    platformDefaultRateCents: 800,
  },
];

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

  await db
    .insert(reimbursementTypes)
    .values(REIMBURSEMENT_TYPES)
    .onConflictDoUpdate({
      target: reimbursementTypes.key,
      set: {
        legalReference: sql`excluded.legal_reference`,
        yearlyLimitCents: sql`excluded.yearly_limit_cents`,
        platformDefaultRateCents: sql`excluded.platform_default_rate_cents`,
      },
    });
  console.log(`Synced ${REIMBURSEMENT_TYPES.length} reimbursement types`);

  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
