import { Property, Required } from '@tsed/common';
import { Model, ObjectID } from '@tsed/mongoose';

interface CargoCompany {
  name: string;
  price: number;
}

interface CargoSupplier {
  supplierId: string;
  price: number;
}

@Model()
export default class CargoGroup {
  @ObjectID('id')
  _id: string;

  @Required()
  name: string;

  @Property()
  cargoCompanies: CargoCompany[];

  @Property()
  suppliers: CargoSupplier[];
}
