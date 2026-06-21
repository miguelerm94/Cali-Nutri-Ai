/** Interfaz base para todos los repositorios (BackendArchitecture.md §6). */
export interface IRepository<TEntity, TId = string> {
  findById(id: TId): Promise<TEntity | null>;
  create(data: Partial<TEntity>): Promise<TEntity>;
  update(id: TId, data: Partial<TEntity>): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}
