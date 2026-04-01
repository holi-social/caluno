import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { RequirementFulfillment } from '../models/requirement-fulfillment.model';
import type { RequirementFulfillmentEntity } from '../schemas/requirement-fulfillment.schema';

@Mapper({ model: RequirementFulfillment })
export class RequirementFulfillmentMapper extends BaseMapper<
  RequirementFulfillment,
  RequirementFulfillmentEntity
> {}
