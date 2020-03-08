import { Property, Required } from '@tsed/common';
import { Model, ObjectID } from '@tsed/mongoose';

@Model()
export default class Market {
  @ObjectID('id')
  _id: string;

  @Required()
  name: string;

  @Property()
  marginOfSafety: number;

  @Property()
  minProfit: number;

  @Property()
  baseMarket: string;

  @Property()
  competePrice: number;

  @Property()
  aggresiveProfit: number;
}
