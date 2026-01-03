import { Model, Document } from 'mongoose';
import { BaseRepository } from '../../domain/repositories/base.repository.interface';

export abstract class BaseRepositoryImpl<
  TEntity,
  TData,
  TDocument extends Document = Document,
> implements BaseRepository<TEntity, TData> {
  constructor(protected readonly model: Model<TDocument>) {}

  protected abstract toEntity(document: TDocument): TEntity;

  async create(data: TData): Promise<TEntity> {
    const document = new this.model(data);
    const saved = await document.save();
    return this.toEntity(saved);
  }

  async findById(id: string): Promise<TEntity | null> {
    const document = await this.model.findOne({ _id: id }).exec();
    if (!document) {
      return null;
    }
    return this.toEntity(document);
  }

  async findAll(): Promise<TEntity[]> {
    const documents = await this.model.find().exec();
    return documents.map((doc) => this.toEntity(doc));
  }

  async update(id: string, data: Partial<TData>): Promise<TEntity | null> {
    const document = await this.model
      .findOneAndUpdate(
        { _id: id },
        { ...data, updatedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!document) {
      return null;
    }
    return this.toEntity(document);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }
}
