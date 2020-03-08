import { Inject, Service } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import Platform from '../models/Platform';

@Service()
export default class PlatformService {
  @Inject(Platform)
  private Platform: MongooseModel<Platform>;

  async save(platform: Platform): Promise<Platform> {
    const model = new this.Platform(platform);
    await model.update(platform, { upsert: true, setDefaultsOnInsert: true });

    return model;
  }

  async query(options = {}): Promise<Platform[]> {
    return this.Platform.find(options).exec();
  }

  async remove(id: string): Promise<Platform> {
    return await this.Platform.findById(id)
      .remove()
      .exec();
  }
}
