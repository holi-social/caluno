import {
  POSTHOG_EVENT,
  POSTHOG_SURFACE,
} from '../shared/observability/posthog.events';
import { PostHogService } from '../shared/observability/posthog.service';
import { EventInviteStatus } from './enums';
import { EventService } from './event.service';

function createEventService(options: { capture: jest.Mock }) {
  const db = {
    query: {
      events: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'event-1',
          organizationUnitId: 'ou-1',
          startsAt: new Date('2026-10-01T09:00:00.000Z'),
        }),
      },
      eventInvites: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'invite-1',
          eventId: 'event-1',
          userId: 'volunteer-1',
          status: EventInviteStatus.JOINED,
        }),
      },
      organizationUnits: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ou-1',
          organizationId: 'org-1',
        }),
      },
    },
    transaction: jest
      .fn()
      .mockImplementation(async (fn: (tx: object) => unknown) =>
        fn({
          update: jest.fn().mockReturnValue({
            set: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                returning: jest.fn().mockResolvedValue([
                  {
                    id: 'invite-1',
                    eventId: 'event-1',
                    userId: 'volunteer-1',
                    status: EventInviteStatus.VOLUNTEER_CANCELLED,
                  },
                ]),
              }),
            }),
          }),
        }),
      ),
  };

  return new EventService(
    db as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    { capture: options.capture } as unknown as PostHogService,
  );
}

describe('EventService.updateEventInviteStatus PostHog', () => {
  it('records previous_status when a volunteer cancels their participation', async () => {
    const capture = jest.fn();
    const service = createEventService({ capture });

    await service.updateEventInviteStatus(
      'volunteer-1',
      'event-1',
      EventInviteStatus.VOLUNTEER_CANCELLED,
    );

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      event: POSTHOG_EVENT.EVENT_INVITE_UPDATE,
      userId: 'volunteer-1',
      properties: {
        surface: POSTHOG_SURFACE.VOLUNTEERING,
        organization_id: 'org-1',
        organization_unit_id: 'ou-1',
        source: 'self',
        event_id: 'event-1',
        invite_status: EventInviteStatus.VOLUNTEER_CANCELLED,
        previous_status: EventInviteStatus.JOINED,
      },
    });
  });
});
