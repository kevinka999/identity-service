export interface BaseRepository<TEntity, TData> {
  create(data: TData): Promise<TEntity>;
  findById(id: string): Promise<TEntity | null>;
  findAll(): Promise<TEntity[]>;
  update(id: string, data: Partial<TData>): Promise<TEntity | null>;
  delete(id: string): Promise<boolean>;
}

