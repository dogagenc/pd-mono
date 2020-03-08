import { Default, Required } from '@tsed/common';
import { Model, ObjectID } from '@tsed/mongoose';

@Model()
export default class Platform {
  @ObjectID('id')
  _id: string;

  @Required()
  name: string;

  @Default(0)
  marginOfSafety = 0;

  @Default(0)
  specialProductRate = 0;

  @Default(0)
  minProfit = 0;

  @Default(0)
  competeRate = 0;

  @Default('')
  baseMarket = '';
}
