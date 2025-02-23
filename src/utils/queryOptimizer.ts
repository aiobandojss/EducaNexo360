import { Document, Query } from 'mongoose';

export class QueryOptimizer {
  static optimizeFind<T extends Document>(query: Query<T[], T>) {
    // Optimizar consultas que devuelven arrays
    query.lean();
    query.select('-__v');
    return query;
  }

  static optimizeFindOne<T extends Document>(query: Query<T | null, T>) {
    // Optimizar consultas que devuelven un solo documento
    query.lean();
    query.select('-__v');
    return query;
  }

  static async executeWithTimeout<T>(query: Promise<T>, timeoutMs: number = 5000): Promise<T> {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`La consulta excedió el tiempo límite de ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([query, timeout]) as Promise<T>;
  }

  static createProjection(fields: string[]): Record<string, 1 | 0> {
    const projection: Record<string, 1 | 0> = {};
    fields.forEach((field) => {
      projection[field] = 1;
    });
    return projection;
  }

  static createAggregationPipeline({
    match = {},
    sort = { createdAt: -1 },
    limit = 10,
    skip = 0,
    project = {},
  }: {
    match?: Record<string, any>;
    sort?: Record<string, 1 | -1>;
    limit?: number;
    skip?: number;
    project?: Record<string, 1 | 0>;
  }) {
    return [
      { $match: match },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
      { $project: project },
    ];
  }
}
