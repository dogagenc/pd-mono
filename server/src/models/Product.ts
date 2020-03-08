import { Default, Property, Required } from '@tsed/common';
import {
  Model,
  ObjectID,
  MongoosePlugin,
  PreHook,
  Indexed
} from '@tsed/mongoose';
import * as mongoosePaginete from 'mongoose-paginate-v2';
import CalculationService from '../services/CalculationService';

export interface Value {
  value: string;
}

interface MarketUrl {
  name: string;
  url: string;
}

interface SupplierInfo {
  supplierPublicId: string;
  price: number;
  cargoPrice: number;
  vatPercentage: number;
  maturity: number;
  deliveryTime: number;
}

interface Price {
  source: string;
  value: string;
}

export interface Calculation {
  type: 'tedarikci' | 'platform' | 'pazaryeri';
  result: {
    [key: string]: any;
  };
  createdAt: Date;
}

@Model()
@MongoosePlugin(mongoosePaginete)
export default class Product {
  @ObjectID('id')
  _id: string;

  @Required()
  name: string;

  @Property()
  brand: string;

  @Required()
  sku: string;

  @Property()
  regularPrice: number;

  @Default([])
  prices: Price[] = [];

  @Property()
  skus: Value[];

  @Property()
  category: string;

  @Property()
  description: string;

  @Property()
  imageCount: number;

  @Default('jpg')
  imageFormat: 'jpg';

  @Default([])
  enabledPlatformIds: Value[] = [];

  @Default([])
  enabledMarketIds: Value[] = [];

  @Default([])
  marketUrls: MarketUrl[] = [];

  @Default([])
  supplierInfos: SupplierInfo[] = [];

  @Property()
  cargoGroup: string;

  @Property()
  calculations: Calculation[] = [];

  @Indexed()
  calculationKey: string;

  @PreHook('update')
  static preUpdate(query: any, next: any): void {
    const product: Product = query.getUpdate();
    const calc = new CalculationService(product);

    calc.check(next);
  }
}
