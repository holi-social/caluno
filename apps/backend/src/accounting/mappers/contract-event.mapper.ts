import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ContractEvent } from '../models/contract-event.model';
import type { ContractEventEntity } from '../schemas/contract-event.schema';

@Mapper({ model: ContractEvent })
export class ContractEventMapper extends BaseMapper<
  ContractEvent,
  ContractEventEntity
> {}
