import type {
  GetPublicEventQuery,
  JoinEventMutation,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export type RawPublicEvent = GetPublicEventQuery['publicEvent'];

export class PublicEventRepository extends BaseRepository {
  async findById(id: string): Promise<RawPublicEvent> {
    const data = await this.sdk.GetPublicEvent({ id });
    return data.publicEvent;
  }

  async join(eventId: string): Promise<JoinEventMutation['joinEvent']> {
    const data = await this.sdk.JoinEvent({ eventId });
    return data.joinEvent;
  }
}
