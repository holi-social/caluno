import type { Database } from '../../src/database/database.module';
import * as schema from '../../src/database/schema';
import { ShiftVisibility } from '../../src/shift/enums';
import { getDurationMinutes } from '../../src/shift/utils/duration';
import { expandShift } from '../../src/shift/utils/rrule-expander';
import { slugify } from '../../src/utils/slug.util';
import { createUser } from './user.factory';

export type Shift = typeof schema.shifts.$inferSelect;

export type CreateShiftOptions = {
  organizationUnitId: string;
  /** Defaults to a freshly created user when omitted. */
  createdById?: string;
  title?: string;
  startsAt?: Date;
  endsAt?: Date;
  rrule?: string | null;
  visibility?: ShiftVisibility;
  location?: string | null;
  instructions?: string | null;
  maxVolunteers?: number | null;
  minVolunteers?: number | null;
  eventId?: string | null;
};

const defaultStartsAt = new Date(Date.now() + 100000);
const defaultEndsAt = new Date(Date.now() + 200000);

/**
 * Inserts a shift (template) plus its expanded instances directly into the
 * database, mirroring what `ShiftService.create` persists — without going
 * through the service or GraphQL, so test setup stays decoupled from the code
 * under test.
 */
export const createShift = async (
  db: Database,
  options: CreateShiftOptions,
): Promise<Shift> => {
  const title = options.title ?? `Test Shift ${crypto.randomUUID()}`;
  const startsAt = options.startsAt ?? defaultStartsAt;
  const endsAt = options.endsAt ?? defaultEndsAt;
  const durationMinutes = getDurationMinutes(startsAt, endsAt);
  const rrule = options.rrule ?? null;
  const createdById = options.createdById ?? (await createUser(db)).id;

  const [shift] = await db
    .insert(schema.shifts)
    .values({
      title,
      slug: slugify(title),
      instructions: options.instructions ?? null,
      organizationUnitId: options.organizationUnitId,
      createdById,
      location: options.location ?? null,
      visibility: options.visibility ?? ShiftVisibility.ALL_MEMBERS,
      maxVolunteers: options.maxVolunteers ?? null,
      minVolunteers: options.minVolunteers ?? null,
      eventId: options.eventId ?? null,
      rrule,
      originalStartsAt: startsAt,
      durationMinutes,
    })
    .returning();

  if (!shift) {
    throw new Error('Failed to create test shift');
  }

  const instances = expandShift(rrule, startsAt, durationMinutes);
  if (instances.length > 0) {
    await db.insert(schema.shiftInstances).values(
      instances.map((instance) => ({
        masterId: shift.id,
        actualStartsAt: instance.actualStartsAt,
        actualEndsAt: instance.actualEndsAt,
        occurrenceIndex: instance.occurrenceIndex,
      })),
    );
  }

  return shift;
};
