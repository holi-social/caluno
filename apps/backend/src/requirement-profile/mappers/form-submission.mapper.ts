import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { FormSubmission } from '../models/form-submission.model';
import type { FormSubmissionEntity } from '../schemas/form-submission.schema';

@Mapper({ model: FormSubmission })
export class FormSubmissionMapper extends BaseMapper<
  FormSubmission,
  FormSubmissionEntity
> {}
