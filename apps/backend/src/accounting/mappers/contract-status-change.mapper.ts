import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ContractStatusChange } from '../models/contract-status-change.model';
import type { ContractStatusChangeEntity } from '../schemas/contract-status-change.schema';

@Mapper({ model: ContractStatusChange })
export class ContractStatusChangeMapper extends BaseMapper<
  ContractStatusChange,
  ContractStatusChangeEntity
> {}
