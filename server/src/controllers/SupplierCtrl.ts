import {
  Controller,
  Get,
  Post,
  BodyParams,
  Delete,
  PathParams,
  Status,
  Required
} from '@tsed/common';
import Supplier from '../models/Supplier';
import SupplierService from '../services/SupplierService';

@Controller('/suppliers')
export default class SupplierCtrl {
  constructor(private service: SupplierService) {}

  @Get('/')
  async get(): Promise<Supplier[]> {
    return this.service.query();
  }

  @Post('/')
  async post(@BodyParams() supplier: Supplier): Promise<Supplier> {
    return this.service.save(supplier);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
