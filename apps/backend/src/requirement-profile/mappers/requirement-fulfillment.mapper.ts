import { plainToInstance } from 'class-transformer';
import { Mapper } from '../../shared/decorators/mapper.decorator';
import { BaseMapper } from '../../shared/mapper';
import { RequirementType } from '../enums';
import {
  RequirementFulfillment,
  RequirementFulfillmentCheck,
  RequirementFulfillmentDate,
  RequirementFulfillmentText,
  RequirementFulfillmentUpload,
} from '../models/requirement-fulfillment.model';
import type { RequirementFulfillmentEntity } from '../schemas/requirement-fulfillment.schema';

@Mapper({ model: RequirementFulfillment })
export class RequirementFulfillmentMapper extends BaseMapper<
  RequirementFulfillment,
  RequirementFulfillmentEntity
> {
  override toModel(
    entity: RequirementFulfillmentEntity | null | undefined,
  ): RequirementFulfillment | null {
    if (!entity) {
      return null;
    }

    const modelClass = this.resolveModelClass(entity.type);
    const normalizedValue =
      entity.value === null
        ? null
        : typeof entity.value === 'string'
          ? entity.value
          : JSON.stringify(entity.value);

    return plainToInstance(
      modelClass,
      {
        ...entity,
        value: normalizedValue,
      },
      {
        excludeExtraneousValues: false,
      },
    );
  }

  private resolveModelClass(type: string): new () => RequirementFulfillment {
    switch (type) {
      case RequirementType.DOCUMENT:
        return RequirementFulfillmentUpload;
      case RequirementType.CHECK:
        return RequirementFulfillmentCheck;
      case RequirementType.DATE:
        return RequirementFulfillmentDate;
      case RequirementType.TEXT:
        return RequirementFulfillmentText;
      default:
        throw new Error(`Unknown requirement fulfillment type: ${type}`);
    }
  }
}
