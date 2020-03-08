import { Query } from 'mongoose';
import { MongooseModel } from '@tsed/mongoose';

export interface PaginatedModel<T> extends MongooseModel<T> {
  paginate: (query: any, options: any) => Query<any>; // eslint-disable-line
}
