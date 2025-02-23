import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  fields?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class QueryUtils<T extends Document> {
  constructor(private readonly model: Model<T>) {}

  async findWithPagination(
    filter: FilterQuery<T> = {},
    options: PaginationOptions = {},
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(100, options.limit || 10));
    const skip = (page - 1) * limit;

    const query = this.model.find(filter).lean().select('-__v');

    if (options.sort) {
      query.sort(options.sort.split(',').join(' '));
    }

    if (options.fields) {
      query.select(options.fields.split(',').join(' '));
    }

    query.skip(skip).limit(limit);

    const [data, total] = await Promise.all([query.exec(), this.model.countDocuments(filter)]);

    return {
      data: data as T[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    const result = await this.model.findOne(filter).lean().select('-__v').exec();

    return result as T | null;
  }

  async findById(id: string, extraFilter: FilterQuery<T> = {}): Promise<T | null> {
    const result = await this.model
      .findOne({ _id: id, ...extraFilter } as FilterQuery<T>)
      .lean()
      .select('-__v')
      .exec();

    return result as T | null;
  }

  async update(filter: FilterQuery<T>, update: UpdateQuery<T>): Promise<T | null> {
    const result = await this.model
      .findOneAndUpdate(filter, update, {
        new: true,
        runValidators: true,
        lean: true,
      })
      .select('-__v')
      .exec();

    return result as T | null;
  }
}

export default QueryUtils;
