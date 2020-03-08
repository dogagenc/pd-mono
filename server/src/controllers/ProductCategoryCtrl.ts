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
import ProductCategoryService from '../services/ProductCategoryService';
import ProductCategory from '../models/ProductCategory';

@Controller('/product-categories')
export default class ProductCategoryCtrl {
  constructor(private service: ProductCategoryService) {}

  @Get('/')
  async get(): Promise<ProductCategory[]> {
    return this.service.query();
  }

  @Post('/')
  async post(
    @BodyParams() productCategory: ProductCategory
  ): Promise<ProductCategory> {
    return this.service.save(productCategory);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
