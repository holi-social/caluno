jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { ShiftVisibility } from '../../shift/enums';
import { ShiftInstanceMapper } from '../../shift/mappers/shift-instance.mapper';
import type { ShiftEntity } from '../../shift/schemas/shift.schema';
import type { ShiftInstanceEntity } from '../../shift/schemas/shift-instance.schema';
import { ShiftService } from '../../shift/shift.service';
import { UserMapper } from '../../user/mappers/user.mapper';
import { UserService } from '../../user/user.service';
import type { TimeEntryEntity } from '../schemas/time-entry.schema';
import type { TimeEntryLoader } from './time-entry.loader';
import { TimeEntryFieldResolver } from './time-entry-field.resolver';

const now = new Date('2026-06-24T09:00:00Z');

const shift = {
  id: 'shift-1',
  title: 'Kitchen',
  slug: 'kitchen',
  instructions: null,
  organizationUnitId: 'unit-1',
  createdById: 'user-owner',
  location: null,
  imageUrl: null,
  visibility: ShiftVisibility.ALL_MEMBERS,
  maxVolunteers: null,
  minVolunteers: null,
  rrule: null,
  originalStartsAt: now,
  durationMinutes: 120,
  isDeleted: false,
  eventId: null,
  createdAt: now,
  updatedAt: now,
} satisfies ShiftEntity;

const shiftInstance = {
  id: 'shift-instance-1',
  masterId: shift.id,
  actualStartsAt: now,
  actualEndsAt: new Date('2026-06-24T11:00:00Z'),
  overrideTitle: null,
  overrideInstructions: null,
  overrideLocation: null,
  overrideMaxVolunteers: null,
  overrideMinVolunteers: null,
  isException: false,
  isCancelled: false,
  cancelledBySync: false,
  occurrenceIndex: 0,
  createdAt: now,
  updatedAt: now,
  master: shift,
} satisfies ShiftInstanceEntity & { master: ShiftEntity };

const timeEntry = {
  id: 'time-entry-1',
  shiftInstanceId: shiftInstance.id,
  organizationUnitId: 'unit-1',
  volunteerId: 'user-volunteer',
  startedAt: now,
  endedAt: null,
  notes: null,
  reimbursementTypeId: null,
  isPaid: false,
  createdAt: now,
  updatedAt: now,
} satisfies TimeEntryEntity;

describe('TimeEntryFieldResolver', () => {
  let shiftService: { findInstanceById: jest.Mock };
  let resolver: TimeEntryFieldResolver;

  beforeEach(() => {
    shiftService = {
      findInstanceById: jest.fn(),
    };
    resolver = new TimeEntryFieldResolver(
      shiftService as unknown as ShiftService,
      {} as unknown as UserService,
      {} as unknown as UserMapper,
      new ShiftInstanceMapper(),
    );
  });

  it('uses a preloaded shift instance when the TimeEntry parent already has one', async () => {
    const result = await resolver.shiftInstance(
      { ...timeEntry, shiftInstance },
      {} as AuthenticatedGraphQLContext,
    );

    expect(result).not.toBeNull();
    expect(result!.id).toBe(shiftInstance.id);
    expect(result!.master.id).toBe(shift.id);
    expect(shiftService.findInstanceById).not.toHaveBeenCalled();
  });

  it('falls back to org-scoped lookup when the relation is not preloaded', async () => {
    shiftService.findInstanceById.mockResolvedValue(shiftInstance);

    const result = await resolver.shiftInstance(timeEntry, {
      organizationUnitId: 'unit-1',
    } as AuthenticatedGraphQLContext);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(shiftInstance.id);
    expect(shiftService.findInstanceById).toHaveBeenCalledWith(
      shiftInstance.id,
      'unit-1',
    );
  });

  it('returns null for shiftInstance when the entry has no shift instance', async () => {
    const result = await resolver.shiftInstance(
      { ...timeEntry, shiftInstanceId: null, shiftInstance: null },
      {} as AuthenticatedGraphQLContext,
    );

    expect(result).toBeNull();
    expect(shiftService.findInstanceById).not.toHaveBeenCalled();
  });

  it('resolves organizationUnit through the TimeEntryLoader', async () => {
    const unit = { id: 'unit-1', name: 'Kitchen Crew' };
    const load = jest.fn().mockResolvedValue(unit);
    const loader = {
      organizationUnitById: { load },
    } as unknown as TimeEntryLoader;

    const result = await resolver.organizationUnit(timeEntry, loader);

    expect(result.id).toBe('unit-1');
    expect(load).toHaveBeenCalledWith('unit-1');
  });
});
