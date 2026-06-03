import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirementFormBlockRefMapper } from '../mappers/requirement-form-block-ref.mapper';
import { RequirementForm } from '../models/requirement-form.model';
import { RequirementFormBlockRef } from '../models/requirement-form-block-ref.model';
import { RequirementFormService } from '../services';

@Resolver(() => RequirementForm)
export class RequirementFormFieldResolver {
  constructor(
    private readonly requirementFormService: RequirementFormService,
    private readonly requirementFormBlockRefMapper: RequirementFormBlockRefMapper,
  ) {}

  @AllowAnonymous()
  @ResolveField(() => [RequirementFormBlockRef], { nullable: true })
  async blockRefs(
    @Parent() form: RequirementForm,
  ): Promise<RequirementFormBlockRef[]> {
    const entities = await this.requirementFormService.findBlockRefs(form.id);
    return this.requirementFormBlockRefMapper.toArray(entities);
  }

  @ResolveField(() => Number)
  async submissionCount(@Parent() form: RequirementForm): Promise<number> {
    return this.requirementFormService.countSubmissions(form.id);
  }
}
