import { plainToInstance } from 'class-transformer';
import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { FormSubmissionValue } from '../models/form-submission-value.model';
import type { FormSubmissionValueEntity } from '../schemas/form-submission-value.schema';

@Mapper({ model: FormSubmissionValue })
export class FormSubmissionValueMapper extends BaseMapper<
  FormSubmissionValue,
  FormSubmissionValueEntity
> {
  override toModel(
    entity: FormSubmissionValueEntity | null | undefined,
  ): FormSubmissionValue | null {
    if (!entity) {
      return null;
    }

    // MULTI_CHOICE values are stored as a jsonb array (see parseValue in
    // FormSubmissionService) while the GraphQL model declares value: String —
    // serialize back to the comma-separated form the rest of the pipeline uses.
    const value = Array.isArray(entity.value)
      ? entity.value.join(',')
      : entity.value;

    return plainToInstance(
      this.modelClass,
      { ...entity, value },
      { excludeExtraneousValues: false },
    );
  }
}
