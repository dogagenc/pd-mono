import { Property, Required } from '@tsed/common';
import { Model, ObjectID } from '@tsed/mongoose';

interface Person {
  name: string;
  phone: string;
}

interface Bank {
  name: string;
  no: string;
  branch: string;
  iban: string;
}

@Model()
export default class Supplier {
  @ObjectID('id')
  _id: string;

  @Required()
  name: string;

  @Property()
  bussinessName: string;

  @Required()
  publicID: string;

  @Property()
  address: string;

  @Property()
  taxOffice: string;

  @Property()
  taxNumber: string;

  @Property()
  contacts: [Person];

  @Property()
  banks: [Bank];
}
