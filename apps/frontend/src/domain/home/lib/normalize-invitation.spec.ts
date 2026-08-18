import { describe, expect, it } from 'bun:test';
import type { MergedInvitation } from './merge-invitations';
import { normalizeInvitation } from './normalize-invitation';

const shiftInvite = (
  overrides: Partial<MergedInvitation & { kind: 'shift' }> = {},
): MergedInvitation =>
  ({
    kind: 'shift',
    id: 'instance-1',
    startsAt: '2026-08-19T12:00:00.000Z',
    shift: {
      id: 'instance-1',
      actualStartsAt: '2026-08-19T12:00:00.000Z',
      actualEndsAt: '2026-08-19T16:00:00.000Z',
      myInvitedAt: '2026-08-12T09:00:00.000Z',
      master: {
        id: 'shift-1',
        title: 'Food Distribution',
        location: 'Playground Community Center',
        rrule: 'FREQ=WEEKLY',
        organizationUnit: { name: 'Helping Hands', logoUrl: null },
      },
    },
    ...overrides,
  }) as unknown as MergedInvitation;

const eventInvite = (
  overrides: Partial<MergedInvitation & { kind: 'event' }> = {},
): MergedInvitation =>
  ({
    kind: 'event',
    id: 'event-1',
    startsAt: '2026-08-19T09:00:00.000Z',
    event: {
      id: 'event-1',
      title: 'Community Fair',
      location: 'Main Square',
      startsAt: '2026-08-19T09:00:00.000Z',
      endsAt: '2026-08-19T17:00:00.000Z',
      myInvitedAt: '2026-08-15T10:00:00.000Z',
      organizationUnit: { name: 'Walking Feet', logoUrl: 'https://x/logo.png' },
    },
    ...overrides,
  }) as unknown as MergedInvitation;

describe('normalizeInvitation', () => {
  it('normalizes a shift invite', () => {
    const result = normalizeInvitation(shiftInvite());

    expect(result).toEqual({
      kind: 'shift',
      id: 'instance-1',
      detailHref: '/shifts/shift-1?instanceId=instance-1',
      title: 'Food Distribution',
      location: 'Playground Community Center',
      orgName: 'Helping Hands',
      orgLogoUrl: null,
      invitedAt: '2026-08-12T09:00:00.000Z',
      startsAt: '2026-08-19T12:00:00.000Z',
      endsAt: '2026-08-19T16:00:00.000Z',
      isMultiDay: false,
      rrule: 'FREQ=WEEKLY',
    });
  });

  it('normalizes a same-day event invite as not multi-day', () => {
    const result = normalizeInvitation(eventInvite());

    expect(result.kind).toBe('event');
    expect(result.id).toBe('event-1');
    expect(result.detailHref).toBe('/events/event-1');
    expect(result.orgLogoUrl).toBe('https://x/logo.png');
    expect(result.rrule).toBeNull();
    expect(result.isMultiDay).toBe(false);
  });

  it('normalizes a multi-day event invite as multi-day', () => {
    const result = normalizeInvitation(
      eventInvite({
        event: {
          id: 'event-1',
          title: 'Community Fair',
          location: 'Main Square',
          startsAt: '2026-08-19T09:00:00.000Z',
          endsAt: '2026-08-21T17:00:00.000Z',
          myInvitedAt: '2026-08-15T10:00:00.000Z',
          organizationUnit: { name: 'Walking Feet', logoUrl: null },
        },
      } as never),
    );

    expect(result.isMultiDay).toBe(true);
  });

  it('passes through a null location and null invitedAt', () => {
    const result = normalizeInvitation(
      shiftInvite({
        shift: {
          id: 'instance-1',
          actualStartsAt: '2026-08-19T12:00:00.000Z',
          actualEndsAt: '2026-08-19T16:00:00.000Z',
          myInvitedAt: null,
          master: {
            id: 'shift-1',
            title: 'Food Distribution',
            location: null,
            rrule: null,
            organizationUnit: { name: 'Helping Hands', logoUrl: null },
          },
        },
      } as never),
    );

    expect(result.location).toBeNull();
    expect(result.invitedAt).toBeNull();
    expect(result.rrule).toBeNull();
  });
});
