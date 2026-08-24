import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { Contract } from '../models/contract.model';
import type { ContractEntity } from '../schemas/contract.schema';

@Mapper({ model: Contract })
export class ContractMapper extends BaseMapper<Contract, ContractEntity> {}
