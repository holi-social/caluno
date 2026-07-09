import type { BuildQueryResult, DBQueryConfig } from 'drizzle-orm';
import type { relations } from './relations';

type Schema = typeof relations;

type IncludeRelation<TTableName extends keyof Schema> =
  DBQueryConfig<'many', Schema, Schema[TTableName]> extends {
    with?: infer TWith;
  }
    ? TWith
    : undefined;

export type InferResultType<
  TTableName extends keyof Schema,
  TWith extends IncludeRelation<TTableName> | undefined = undefined,
> = BuildQueryResult<
  Schema,
  Schema[TTableName],
  TWith extends undefined ? true : { with: TWith }
>;
