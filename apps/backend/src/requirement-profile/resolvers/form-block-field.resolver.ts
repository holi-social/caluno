import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { FormBlockFieldMapper } from '../mappers/form-block-field.mapper';
import { FormBlock } from '../models/form-block.model';
import { FormBlockField } from '../models/form-block-field.model';
import { FormBlockService } from '../services';

@Resolver(() => FormBlock)
export class FormBlockFieldResolver {
  constructor(
    private readonly formBlockService: FormBlockService,
    private readonly formBlockFieldMapper: FormBlockFieldMapper,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => [FormBlockField], { nullable: true })
  async fields(@Parent() block: FormBlock): Promise<FormBlockField[]> {
    const entities = await this.formBlockService.findFields(block.id);
    return this.formBlockFieldMapper.toArray(entities);
  }

  @AllowAnonymous()
  @ResolveField(() => Boolean)
  async isEditable(@Parent() block: FormBlock): Promise<boolean> {
    return this.formBlockService.isEditable(block.id);
  }
}
