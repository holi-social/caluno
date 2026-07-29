import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { RegisterLoader } from '../../graphql/interceptors';
import { EventService } from '../event.service';
import type { EventInviteEntity } from '../schemas/event-invite.schema';

@RegisterLoader()
@Injectable({ scope: Scope.REQUEST })
export class EventInviteLoader {
  constructor(private readonly eventService: EventService) {}

  // Key is `${eventId}:${userId}` — within one request every key shares the
  // same userId (the session user), so batching by eventId still holds.
  public readonly inviteByEventIdAndUserId = new DataLoader<
    string,
    EventInviteEntity | null
  >(async (keys: readonly string[]) => {
    const parsed = keys.map((key) => {
      const [eventId, userId] = key.split(':');
      return { eventId, userId };
    });

    const userId = parsed[0]?.userId;
    const eventIds = parsed.map(({ eventId }) => eventId);

    const invites = userId
      ? await this.eventService.findInvitesByEventIdsForUser(eventIds, userId)
      : [];

    const inviteByEventId = new Map(
      invites.map((invite) => [invite.eventId, invite]),
    );

    return parsed.map(({ eventId }) => inviteByEventId.get(eventId) ?? null);
  });
}
