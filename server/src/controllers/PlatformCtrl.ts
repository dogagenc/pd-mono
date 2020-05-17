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
import PlatformService from '../services/PlatformService';
import Platform from '../models/Platform';

@Controller('/platforms')
export default class PlatformCtrl {
  constructor(private service: PlatformService) {}

  @Get('/')
  async get(): Promise<Platform[]> {
    return this.service.query();
  }

  @Put('/')
  @Post('/')
  async post(@BodyParams() platform: Platform): Promise<Platform> {
    return this.service.save(platform);
  }

  @Delete('/:id')
  @Status(204)
  async delete(@Required() @PathParams('id') id: string): Promise<void> {
    await this.service.remove(id);
  }
}
