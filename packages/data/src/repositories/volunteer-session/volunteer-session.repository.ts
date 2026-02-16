import { DataError } from '../../errors/data-error';
import type {
  ApproveVolunteerSessionInput,
  RejectVolunteerSessionInput,
  StartVolunteerSessionInput,
  VolunteerSessionStatus,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class VolunteerSessionRepository extends BaseRepository {
  async approve(input: ApproveVolunteerSessionInput) {
    try {
      const data = await this.sdk.ApproveVolunteerSession({ input });
      return data.approveVolunteerSession;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async reject(input: RejectVolunteerSessionInput) {
    try {
      const data = await this.sdk.RejectVolunteerSession({ input });
      return data.rejectVolunteerSession;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async findAll(options: { status?: VolunteerSessionStatus } = {}) {
    try {
      const data = await this.sdk.GetVolunteerSessions({
        status: options.status ?? null,
      });
      return data.volunteerSessions;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }

  async start(input: StartVolunteerSessionInput) {
    try {
      const data = await this.sdk.StartVolunteerSession({ input });
      return data.startVolunteerSession;
    } catch (error) {
      throw DataError.fromGraphQLError(error);
    }
  }
}
