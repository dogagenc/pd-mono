import { Inject, Service } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import Supplier from '../models/Supplier';

@Service()
export default class SupplierService {
  @Inject(Supplier)
  private model: MongooseModel<Supplier>;

  async findOne(options = {}): Promise<Supplier> {
    return this.model.findOne(options).exec();
  }

  async save(supplier: Supplier): Promise<Supplier> {
    const model = new this.model(supplier);
    await model.update(supplier, { upsert: true });

    return model;
  }

  async query(options = {}): Promise<Supplier[]> {
    return this.model.find(options).exec();
  }

  async remove(id: string): Promise<Supplier> {
    return await this.model
      .findById(id)
      .remove()
      .exec();
  }
}
