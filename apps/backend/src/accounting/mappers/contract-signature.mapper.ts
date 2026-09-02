import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ContractSignature } from '../models/contract-signature.model';
import type { ContractSignatureEntity } from '../schemas/contract-signature.schema';

@Mapper({ model: ContractSignature })
export class ContractSignatureMapper extends BaseMapper<
  ContractSignature,
  ContractSignatureEntity
> {}
