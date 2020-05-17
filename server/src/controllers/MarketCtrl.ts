import {
  Controller,
  Get,
  Post,
  BodyParams,
  Delete,
  PathParams,
  Status,
  Required,
  Put
} from '@tsed/common';
import MarketService from '../services/MarketService';
import Market from '../models/Market';

@Controller('/markets')
export default class MarketCtrl {
  constructor(private service: MarketService) {}

  @Get('/')
  async get(): Promise<Market[]> {
    return this.service.query();
  }

  @Put('/')
  @Post('/')
  async post(@BodyParams() market: Market): Promise<Market> {
    return this.service.save(market);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
