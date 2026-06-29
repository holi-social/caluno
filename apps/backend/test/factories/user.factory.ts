import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';

export type User = typeof schema.users.$inferSelect;

export const createUser = async (
  db: Database,
  overrides?: Partial<typeof schema.users.$inferInsert>,
): Promise<User> => {
  const suffix = crypto.randomUUID();
  const id = overrides?.id ?? `test-user-${suffix}`;

  const [user] = await db
    .insert(schema.users)
    .values({
      id,
      name: `Test User ${suffix}`,
      email: `test-user-${suffix}@example.com`,
      ...overrides,
    })
    .returning();

  if (!user) {
    throw new Error('Failed to create test user');
  }

  return user;
};
