jest.mock('nanoid', () => ({
  customAlphabet: () => () => 'abcdefghijkl',
}));

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => jest.fn(),
  Session: () => jest.fn(),
}));

import type { ShiftEntity } from '../../shift/schemas/shift.schema';
import { Event } from '../models/event.model';
import type { ShiftEventLoader } from './shift-event.loader';
import { ShiftEventFieldResolver } from './shift-event-field.resolver';

const shift = (overrides: Partial<ShiftEntity>): ShiftEntity =>
  ({
    id: 'shift-1',
    eventId: null,
    ...overrides,
  }) as unknown as ShiftEntity;

const event = (overrides: Partial<Event>): Event =>
  ({
    id: 'event-1',
    title: 'Event Title',
    slug: 'event-title',
    location: null,
    logoUrl: null,
    coverUrl: null,
    coverImageUrl: null,
    organizationUnitId: 'org-unit-1',
    organizer: null,
    startsAt: new Date('2026-08-01T08:00:00Z'),
    endsAt: new Date('2026-08-01T10:00:00Z'),
    isDeleted: false,
    shiftsCount: 0,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    ...overrides,
  }) as Event;

describe('ShiftEventFieldResolver', () => {
  describe('event', () => {
    it('returns null without loading when the shift has no eventId', async () => {
      const resolver = new ShiftEventFieldResolver();
      const load = jest.fn();
      const loader = { eventById: { load } } as unknown as ShiftEventLoader;

      const result = await resolver.event(shift({ eventId: null }), loader);

      expect(result).toBeNull();
      expect(load).not.toHaveBeenCalled();
    });

    it('returns the loaded event for an event shift', async () => {
      const resolver = new ShiftEventFieldResolver();
      const row = event({ id: 'event-1' });
      const load = jest.fn().mockResolvedValue(row);
      const loader = { eventById: { load } } as unknown as ShiftEventLoader;

      const result = await resolver.event(
        shift({ eventId: 'event-1' }),
        loader,
      );

      expect(result?.id).toBe('event-1');
      expect(load).toHaveBeenCalledWith('event-1');
    });
  });
});
