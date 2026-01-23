import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Opportunity } from '../models/opportunity.model';
import type { OpportunityEntity } from '../schemas/opportunity.schema';

@Mapper({ model: Opportunity })
export class OpportunityMapper extends BaseMapper<
    Opportunity,
    OpportunityEntity
> {}
