import { Inject, Service } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import ProductCategory from '../models/ProductCategory';

@Service()
export default class ProductCategoryService {
  @Inject(ProductCategory)
  private ProductCategory: MongooseModel<ProductCategory>;

  async findOne(options: Partial<ProductCategory>): Promise<ProductCategory> {
    return this.ProductCategory.findOne(options).exec();
  }

  async save(productCategory: ProductCategory): Promise<ProductCategory> {
    const model = new this.ProductCategory(productCategory);
    await model.update(productCategory, { upsert: true });

    return model;
  }

  async query(options = {}): Promise<ProductCategory[]> {
    return this.ProductCategory.find(options).exec();
  }

  async remove(id: string): Promise<ProductCategory> {
    return await this.ProductCategory.findById(id)
      .remove()
      .exec();
  }
}
