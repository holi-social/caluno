import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { ShiftRecurrenceRule } from '../models/shift-recurrence-rule.model';
import type { ShiftRecurrenceRuleEntity } from '../schemas/shift-recurrence-rule.schema';

@Mapper({ model: ShiftRecurrenceRule })
export class ShiftRecurrenceRuleMapper extends BaseMapper<
  ShiftRecurrenceRule,
  ShiftRecurrenceRuleEntity
> {}
