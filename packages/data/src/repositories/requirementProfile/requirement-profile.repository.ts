import type {
  CreateRequirementProfileSubmissionInput,
  CreateRequirementProfileSubmissionMutation,
} from '../../generated/graphql';
import { BaseRepository } from '../base/base.repository';

export class RequirementProfileRepository extends BaseRepository {
  async createSubmission(
    input: CreateRequirementProfileSubmissionInput,
  ): Promise<
    CreateRequirementProfileSubmissionMutation['createRequirementProfileSubmission']
  > {
    const data = await this.sdk.CreateRequirementProfileSubmission({ input });
    return data.createRequirementProfileSubmission;
  }
}
