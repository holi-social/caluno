import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ReimbursementType } from '../models/reimbursement-type.model';
import type { ReimbursementTypeEntity } from '../schemas/reimbursement-type.schema';

@Mapper({ model: ReimbursementType })
export class ReimbursementTypeMapper extends BaseMapper<
  ReimbursementType,
  ReimbursementTypeEntity
> {}
