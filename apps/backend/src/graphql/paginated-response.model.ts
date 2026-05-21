import { Field, ObjectType } from '@nestjs/graphql';

import { PaginationInfo } from './pagination-info.model';

export function createPaginatedResponseType<TItem>(
  ItemClass: new () => TItem,
  name: string,
) {
  @ObjectType(`${name}PaginatedResponse`)
  class PaginatedResponse {
    @Field(() => [ItemClass])
    items!: TItem[];

    @Field(() => PaginationInfo)
    pagination!: PaginationInfo;

    constructor({
      items,
      total,
      limit,
      offset,
    }: {
      items: TItem[];
      total: number;
      limit: number;
      offset: number;
    }) {
      this.items = items;
      this.pagination = {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      };
    }
  }

  return PaginatedResponse;
}
