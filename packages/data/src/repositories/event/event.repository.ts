import {
  type CreateEventInput,
  type EventInviteStatus,
  type GetEventInvitesQuery,
  type GetEventQuery,
  type GetEventsQuery,
  type GetMyEventsQuery,
  type SetEventRequiredFormsMutation,
  SortOrder,
  type UpdateEventInput,
  type UpdateEventInviteStatusMutation,
} from '../../generated/graphql';
import {
  BaseRepository,
  type PaginationOptions,
} from '../base/base.repository';

export type RawEvent = GetEventQuery['event'];
export type EventListItem = GetEventsQuery['events']['items'][number];
export type EventInviteItem = GetEventInvitesQuery['eventInvites'][number];
export type MyEvent = GetMyEventsQuery['myEvents']['items'][number];

export class EventRepository extends BaseRepository {
  async findAll(options: PaginationOptions = {}) {
    const data = await this.sdk.GetEvents({
      limit: options.limit ?? 10,
      offset: options.offset ?? 0,
    });
    return data.events;
  }

  async findMyEvents(
    options: {
      includePast?: boolean;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
      order?: SortOrder;
      statuses?: EventInviteStatus[];
    } = {},
  ): Promise<{
    items: MyEvent[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const data = await this.sdk.GetMyEvents({
      includePast: options.includePast ?? false,
      startsAfter: options.from?.toISOString(),
      endsBefore: options.to?.toISOString(),
      limit: options.limit ?? 15,
      offset: options.offset ?? 0,
      order: options.order ?? SortOrder.Asc,
      statuses: options.statuses,
    });
    return data.myEvents;
  }

  async findById(id: string): Promise<RawEvent> {
    const data = await this.sdk.GetEvent({ id });
    return data.event;
  }

  async findInvites(eventId: string): Promise<EventInviteItem[]> {
    const data = await this.sdk.GetEventInvites({ eventId });
    return data.eventInvites;
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

  async updateEventInviteStatus(
    eventId: string,
    status: EventInviteStatus,
    userId?: string,
  ): Promise<UpdateEventInviteStatusMutation['updateEventInviteStatus']> {
    const data = await this.sdk.UpdateEventInviteStatus({
      eventId,
      status,
      userId,
    });
    return data.updateEventInviteStatus;
  }

  async setRequiredForms(
    eventId: string,
    formIds: string[],
  ): Promise<SetEventRequiredFormsMutation['setEventRequiredForms']> {
    const data = await this.sdk.SetEventRequiredForms({ eventId, formIds });
    return data.setEventRequiredForms;
  }
}
