import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { FormSubmissionValue } from '../models/form-submission-value.model';
import type { FormSubmissionValueEntity } from '../schemas/form-submission-value.schema';

@Mapper({ model: FormSubmissionValue })
export class FormSubmissionValueMapper extends BaseMapper<
  FormSubmissionValue,
  FormSubmissionValueEntity
> {}
