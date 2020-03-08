import { Inject, Service } from '@tsed/common';
import { MongooseModel } from '@tsed/mongoose';
import Market from '../models/Market';

@Service()
export default class MarketService {
  @Inject(Market)
  private Market: MongooseModel<Market>;

  async findOne(query: Partial<Market>): Promise<Market> {
    return this.Market.findOne(query);
  }

  async save(market: Market): Promise<Market> {
    const model = new this.Market(market);
    await model.update(market, { upsert: true });

    return model;
  }

  async query(options = {}): Promise<Market[]> {
    return this.Market.find(options).exec();
  }

  async remove(id: string): Promise<Market> {
    return await this.Market.findById(id)
      .remove()
      .exec();
  }
}
