import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { PERMISSIONS } from '../../auth/constants';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import type { AuthenticatedGraphQLContext } from '../../graphql/graphql.context';
import { CreateFormBlockInput } from '../inputs/create-form-block.input';
import { CreateFormBlockFieldInput } from '../inputs/create-form-block-field.input';
import { UpdateFormBlockInput } from '../inputs/update-form-block.input';
import { UpdateFormBlockFieldInput } from '../inputs/update-form-block-field.input';
import { FormBlockMapper } from '../mappers/form-block.mapper';
import { FormBlock } from '../models/form-block.model';
import { FormBlockService } from '../services';

@Resolver(() => FormBlock)
export class FormBlockMutationResolver {
  constructor(
    private readonly formBlockService: FormBlockService,
    private readonly formBlockMapper: FormBlockMapper,
  ) {}

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => FormBlock)
  async createFormBlock(
    @Args('input') input: CreateFormBlockInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<FormBlock> {
    const item = await this.formBlockService.create(
      input,
      context.organizationUnitId,
      session.user.id,
    );
    return this.formBlockMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => FormBlock)
  async updateFormBlock(
    @Args('id') id: string,
    @Args('input') input: UpdateFormBlockInput,
    @Context() context: AuthenticatedGraphQLContext,
    @Session() session: UserSession,
  ): Promise<FormBlock> {
    const item = await this.formBlockService.update(
      id,
      context.organizationUnitId,
      input,
      session.user.id,
    );
    return this.formBlockMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => FormBlock)
  async deleteFormBlock(
    @Args('id') id: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormBlock> {
    const item = await this.formBlockService.delete(
      id,
      context.organizationUnitId,
      context.user.id,
    );
    return this.formBlockMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => FormBlock)
  async createFormBlockField(
    @Args('blockId') blockId: string,
    @Args('input') input: CreateFormBlockFieldInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormBlock> {
    const item = await this.formBlockService.createField(
      blockId,
      context.organizationUnitId,
      input,
      context.user.id,
    );
    return this.formBlockMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => FormBlock)
  async updateFormBlockField(
    @Args('fieldId') fieldId: string,
    @Args('input') input: UpdateFormBlockFieldInput,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormBlock> {
    const item = await this.formBlockService.updateField(
      fieldId,
      context.organizationUnitId,
      input,
      context.user.id,
    );
    return this.formBlockMapper.toModelOrThrow(item);
  }

  @Permissions(PERMISSIONS.REQUIREMENT_PROFILE_EDIT)
  @Mutation(() => FormBlock)
  async deleteFormBlockField(
    @Args('fieldId') fieldId: string,
    @Context() context: AuthenticatedGraphQLContext,
  ): Promise<FormBlock> {
    const item = await this.formBlockService.deleteField(
      fieldId,
      context.organizationUnitId,
      context.user.id,
    );
    return this.formBlockMapper.toModelOrThrow(item);
  }
}
