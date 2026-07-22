import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { slugify } from '../../src/utils/slug.util';
import { createUser } from './user.factory';

export type Event = typeof schema.events.$inferSelect;

export type CreateEventOptions = {
  organizationUnitId: string;
  /** Defaults to a freshly created user when omitted. */
  createdById?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  startsAt?: Date;
  endsAt?: Date;
};

const defaultStartsAt = new Date(Date.now() + 100000);
const defaultEndsAt = new Date(Date.now() + 200000);

/**
 * Inserts an event directly into the database, mirroring what
 * `EventService.create` persists — without going through the service or
 * GraphQL, so test setup stays decoupled from the code under test.
 */
export const createEvent = async (
  db: Database,
  options: CreateEventOptions,
): Promise<Event> => {
  const title = options.title ?? `Test Event ${crypto.randomUUID()}`;
  const startsAt = options.startsAt ?? defaultStartsAt;
  const endsAt = options.endsAt ?? defaultEndsAt;
  const createdById = options.createdById ?? (await createUser(db)).id;

  const [event] = await db
    .insert(schema.events)
    .values({
      title,
      slug: slugify(title),
      description: options.description ?? null,
      location: options.location ?? null,
      logoUrl: options.logoUrl ?? null,
      coverUrl: options.coverUrl ?? null,
      startsAt,
      endsAt,
      organizationUnitId: options.organizationUnitId,
      createdById,
    })
    .returning();

  if (!event) {
    throw new Error('Failed to create test event');
  }

  return event;
};
