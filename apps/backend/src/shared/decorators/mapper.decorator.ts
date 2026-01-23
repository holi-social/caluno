import { Injectable, SetMetadata } from '@nestjs/common';
import type { ClassConstructor } from 'class-transformer';

export const MAPPER_METADATA_KEY = 'mapper:config';

export interface MapperMetadata<TModel = any, TEntity = any> {
  model: ClassConstructor<TModel>;
  entity?: ClassConstructor<TEntity>;
}

export const Mapper = <TModel, TEntity>(
  metadata: MapperMetadata<TModel, TEntity>,
) => {
  return (target: any) => {
    Injectable()(target);
    SetMetadata(MAPPER_METADATA_KEY, metadata)(target);
  };
};
