export interface IMapper<TModel, TEntity> {
    toModel(entity: TEntity | null | undefined): TModel | null;
    toModelOrThrow(entity: TEntity | null | undefined): TModel;
    toArray(entities: (TEntity | null)[]): TModel[];
}
