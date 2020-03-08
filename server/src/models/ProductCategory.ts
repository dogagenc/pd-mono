import { Property, Required } from '@tsed/common';
import { Model, ObjectID } from '@tsed/mongoose';

interface ProductCategoryMapping {
  marketId: string;
  category: string;
  feeRate: number;
}

@Model()
export default class ProductCategory {
  @ObjectID('id')
  _id: string;

  @Required()
  name: string;

  @Property()
  marketMappings: ProductCategoryMapping[];
}
