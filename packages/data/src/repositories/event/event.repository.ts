import type {
  CreateEventInput,
  GetEventAttendeesQuery,
  GetEventQuery,
  GetEventsQuery,
  UpdateEventInput,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export type RawEvent = GetEventQuery['event'];
export type EventListItem = GetEventsQuery['events']['items'][number];
export type EventAttendee = GetEventAttendeesQuery['eventAttendees'][number];

export class EventRepository extends BaseRepository {
  async findAll(options: PaginationOptions = {}) {
    const data = await this.sdk.GetEvents({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.events;
  }

  async findById(id: string): Promise<RawEvent> {
    const data = await this.sdk.GetEvent({ id });
    return data.event;
  }

  async findAttendees(eventId: string): Promise<EventAttendee[]> {
    const data = await this.sdk.GetEventAttendees({ eventId });
    return data.eventAttendees;
  }

  async create(input: CreateEventInput): Promise<RawEvent> {
    const data = await this.sdk.CreateEvent({ input });
    return data.createEvent;
  }

  async update(id: string, input: UpdateEventInput): Promise<RawEvent> {
    const data = await this.sdk.UpdateEvent({ id, input });
    return data.updateEvent;
  }

  async delete(id: string): Promise<{ id: string }> {
    const data = await this.sdk.DeleteEvent({ id });
    return { id: data.deleteEvent.id };
  }

  async inviteMembers(
    eventId: string,
    memberIds: string[],
  ): Promise<{ id: string }> {
    const data = await this.sdk.InviteMembersToEvent({ eventId, memberIds });
    return { id: data.inviteMembersToEvent.id };
  }
}
