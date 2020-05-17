import {
  Controller,
  Get,
  Post,
  BodyParams,
  Delete,
  PathParams,
  Status,
  Required,
  Res,
  Put,
  Next
} from '@tsed/common';
import ProductCategoryService from '../services/ProductCategoryService';
import ProductCategory from '../models/ProductCategory';
import { BadRequest } from 'ts-httpexceptions';
import { NextFunction, Response } from 'express';

@Controller('/product-categories')
export default class ProductCategoryCtrl {
  constructor(private service: ProductCategoryService) {}

  @Get('/')
  async get(): Promise<ProductCategory[]> {
    return this.service.query();
  }

  @Put('/')
  async put(
    @BodyParams() productCategory: ProductCategory
  ): Promise<ProductCategory> {
    return this.service.save(productCategory);
  }

  @Post('/')
  async post(
    @BodyParams() productCategory: ProductCategory,
    @Next() next: NextFunction,
    @Res() res: Response
  ): Promise<ProductCategory | void> {
    const existing = await this.service.findOne({ name: productCategory.name });

    if (existing) {
      return next(
        new BadRequest(
          `Category with name ${productCategory.name} is already exists!`
        )
      );
    }

    const newProduct = await this.service.save(productCategory);
    res.json(newProduct);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
