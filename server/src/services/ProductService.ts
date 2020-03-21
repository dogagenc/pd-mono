import { Inject, Service } from '@tsed/common';
import Product from '../models/Product';
import { PaginatedModel } from '../models/paginated-model';
import { ExportOptionsCalculation } from '../ExportOptions';

export interface CalculationStatus {
  active: boolean;
  total: number;
  finished: number;
}

const createId = (): string => {
  return (
    '_' +
    Math.random()
      .toString(36)
      .substr(2, 9)
  );
};

@Service()
export default class ProductService {
  @Inject(Product)
  private Product: PaginatedModel<Product>;
  private status: CalculationStatus = {
    active: false,
    total: 0,
    finished: 0
  };

  async findOne(options = {}): Promise<Product> {
    return this.Product.findOne(options)
      .lean()
      .exec();
  }

  async save(product: Partial<Product>): Promise<Product> {
    const model = new this.Product(product);
    await model
      .update(product, { upsert: true, setDefaultsOnInsert: true })
      .exec();

    return model;
  }

  async query(query = {}, page: string): Promise<Product[]> {
    const options = {
      page: Number(page),
      limit: 50
    };
    return this.Product.paginate(query, options);
  }

  async remove(id: string): Promise<Product> {
    return await this.Product.findById(id)
      .remove()
      .exec();
  }

  async exportable(calculationType: string): Promise<Product[]> {
    return this.Product.find({ 'calculations.type': calculationType });
  }

  async exportableCalculations(
    calculations: ExportOptionsCalculation[]
  ): Promise<Product[]> {
    const query = {
      'calculations.type': { $in: calculations.map(c => c.type) }
    };
    return this.Product.find(query);
  }

  getCalculationStatus(): CalculationStatus {
    return this.status;
  }

  async recalculate(): Promise<CalculationStatus> {
    if (this.status.active) {
      return Promise.reject('Status is active!');
    }

    const calculationKey = createId();
    let finished = false;
    const count = await this.Product.count({});
    const limit = 100;

    this.status = {
      total: count,
      active: true,
      finished: 0
    };

    Promise.resolve(this.status);

    while (!finished) {
      const products = await this.Product.find({
        calculationKey: { $ne: calculationKey }
      })
        .limit(limit)
        .exec();

      if (!products.length) {
        finished = true;
        this.status.active = false;
      }

      for (const product of products) {
        product.calculationKey = calculationKey;
        await product.save();
        this.status.finished++;
      }
    }
  }
}
