import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ReimbursementRate } from '../models/reimbursement-rate.model';
import type { ReimbursementRateEntity } from '../schemas/reimbursement-rate.schema';

@Mapper({ model: ReimbursementRate })
export class ReimbursementRateMapper extends BaseMapper<
  ReimbursementRate,
  ReimbursementRateEntity
> {}
