import {
  Controller,
  Get,
  Post,
  BodyParams,
  Delete,
  Next,
  PathParams,
  Status,
  Required,
  Res,
  Put
} from '@tsed/common';
import Supplier from '../models/Supplier';
import SupplierService from '../services/SupplierService';
import { BadRequest } from 'ts-httpexceptions';
import { NextFunction, Response } from 'express';

@Controller('/suppliers')
export default class SupplierCtrl {
  constructor(private service: SupplierService) {}

  @Get('/')
  async get(): Promise<Supplier[]> {
    return this.service.query();
  }

  @Put('/')
  async put(@BodyParams() supplier: Supplier): Promise<Supplier> {
    return this.service.save(supplier);
  }

  @Post('/')
  async post(
    @BodyParams() supplier: Supplier,
    @Next() next: NextFunction,
    @Res() res: Response
  ): Promise<Supplier | void> {
    const existing = await this.service.findOne({
      publicID: supplier.publicID
    });

    if (existing) {
      return next(
        new BadRequest(
          `Supplier with id ${supplier.publicID} is already exists!`
        )
      );
    }

    const newSupplier = await this.service.save(supplier);
    res.json(newSupplier);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
