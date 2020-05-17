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
import CargoGroup from '../models/CargoGroup';
import CargoGroupService from '../services/CargoGroupService';

@Controller('/cargo-groups')
export default class CargoGroupCtrl {
  constructor(private service: CargoGroupService) {}

  @Get('/')
  async get(): Promise<CargoGroup[]> {
    return this.service.query();
  }

  @Put('/')
  @Post('/')
  async post(@BodyParams() cargoGroup: CargoGroup): Promise<CargoGroup> {
    return this.service.save(cargoGroup);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
