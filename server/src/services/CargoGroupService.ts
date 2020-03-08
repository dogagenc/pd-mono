import { Inject, Service } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import CargoGroup from '../models/CargoGroup';

@Service()
export default class CargoGroupService {
  @Inject(CargoGroup)
  private model: MongooseModel<CargoGroup>;

  async save(cargoGroup: CargoGroup): Promise<CargoGroup> {
    const model = new this.model(cargoGroup);
    await model.update(cargoGroup, { upsert: true });

    return model;
  }

  async query(options = {}): Promise<CargoGroup[]> {
    return this.model.find(options).exec();
  }

  async remove(id: string): Promise<CargoGroup> {
    return await this.model
      .findById(id)
      .remove()
      .exec();
  }
}
