import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { FormBlockMapper } from '../mappers/form-block.mapper';
import { FormBlock } from '../models/form-block.model';
import { RequirementFormBlockRef } from '../models/requirement-form-block-ref.model';
import { FormBlockService } from '../services';

@Resolver(() => RequirementFormBlockRef)
export class RequirementFormBlockRefFieldResolver {
  constructor(
    private readonly formBlockService: FormBlockService,
    private readonly formBlockMapper: FormBlockMapper,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => FormBlock, { nullable: true })
  async block(
    @Parent() ref: RequirementFormBlockRef,
  ): Promise<FormBlock | null> {
    const entity = await this.formBlockService.findById(ref.blockId);
    return this.formBlockMapper.toModel(entity);
  }
}
