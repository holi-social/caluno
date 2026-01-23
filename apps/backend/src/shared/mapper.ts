import { Reflector } from '@nestjs/core';
import { type ClassConstructor, plainToInstance } from 'class-transformer';
import {
  MAPPER_METADATA_KEY,
  type MapperMetadata,
} from './decorators/mapper.decorator';
import type { IMapper } from './interfaces/mapper.interface';

export abstract class BaseMapper<TModel, TEntity>
  implements IMapper<TModel, TEntity>
{
  protected readonly modelClass: ClassConstructor<TModel>;

  constructor() {
    const reflector = new Reflector();
    const metadata = reflector.get<MapperMetadata<TModel, TEntity>>(
      MAPPER_METADATA_KEY,
      this.constructor,
    );

    if (!metadata?.model) {
      throw new Error(
        `Mapper ${this.constructor.name} must be decorated with @Mapper({ model: YourModel })`,
      );
    }

    this.modelClass = metadata.model;
  }

  toModel(entity: TEntity | null | undefined): TModel | null {
    if (!entity) {
      return null;
    }
    return plainToInstance(this.modelClass, entity, {
      excludeExtraneousValues: false,
    });
  }

  toModelOrThrow(entity: TEntity | null | undefined): TModel {
    const model = this.toModel(entity);
    if (!model) {
      throw new Error(
        `Could not process ${this.modelClass.name.toLowerCase()} entity`,
      );
    }
    return model;
  }

  toArray(entities: (TEntity | null | undefined)[]): TModel[] {
    return entities
      .map((entity) => this.toModel(entity))
      .filter((model): model is TModel => model !== null);
  }
}
