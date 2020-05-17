import {
  Controller,
  Get,
  Post,
  BodyParams,
  Delete,
  PathParams,
  Status,
  Required,
  QueryParams,
  Put
} from '@tsed/common';
import ProductService from '../services/ProductService';
import Product from '../models/Product';

@Controller('/products')
export default class ProductCtrl {
  constructor(private service: ProductService) {}

  @Get('/')
  async get(
    @QueryParams('page') page = '1',
    @QueryParams('filters') filters = '{}'
  ): Promise<Product[]> {
    filters = JSON.parse(filters);
    return this.service.query(filters, page);
  }

  @Get('/:sku')
  async getOne(@Required() @PathParams('sku') sku: string): Promise<Product> {
    return this.service.findOne({ sku });
  }

  @Put('/')
  @Post('/')
  async post(@BodyParams() product: Product): Promise<Product> {
    return this.service.save(product);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
