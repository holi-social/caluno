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
  [PERMISSIONS.PROJECT_CREATE]: 'Create project',
  [PERMISSIONS.PROJECT_READ]: 'Read project',
  [PERMISSIONS.PROJECT_UPDATE]: 'Update project',
  [PERMISSIONS.PROJECT_DELETE]: 'Delete project',
  [PERMISSIONS.PROJECT_PUBLISH]: 'Publish project',
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

  await db
    .insert(permissions)
    .values(values)
    .onConflictDoNothing({ target: permissions.key });

  console.log(`Seeded ${values.length} permissions`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
