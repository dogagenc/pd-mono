import { Request, Response, NextFunction } from 'express';
import {
  Controller,
  Post,
  Req,
  Required,
  Res,
  Use,
  Get,
  QueryParams,
  Next,
  BodyParams
} from '@tsed/common';
import * as multer from 'multer';
import XmlParserService, { ParserStatus } from '../services/XmlParserService';
import ProductService, { CalculationStatus } from '../services/ProductService';
import { writeFileSync } from 'fs';
import { ExportOptions } from '../ExportOptions';
import CalculationService from '@src/services/CalculationService';

@Controller('/upload')
export default class UploadCtrl {
  constructor(
    private service: XmlParserService,
    private productService: ProductService
  ) {}

  @Get('/')
  async getStatus(): Promise<ParserStatus> {
    const status = await this.service.getStatus();

    return status;
  }

  @Post('/')
  @Use(multer().single('file'))
  async upload(@Req() req: Request): Promise<ParserStatus> {
    const status = await this.service.parse(req.file.buffer);

    return status;
  }

  @Get('/recalculate')
  async getCalcStatus(): Promise<CalculationStatus> {
    return this.productService.getCalculationStatus();
  }

  @Post('/recalculate')
  async recalculate(): Promise<CalculationStatus> {
    const status = await this.productService.recalculate();

    return status;
  }

  @Get('/export')
  async download(
    @Required() @QueryParams('type') type: string,
    @Res() res: Response,
    @Next() next: NextFunction
  ): Promise<void> {
    const products = await this.productService.exportable(type);
    const xmlFile = this.service.toXml(products, type);

    const filePath = `/tmp/${type}-hesaplama.xml`;
    writeFileSync(filePath, xmlFile);
    res.download(filePath, err => {
      next(err);
    });
  }

  @Post('/export')
  async downloadByParams(
    @Required() @BodyParams() body: ExportOptions,
    @Res() res: Response,
    @Next() next: NextFunction
  ): Promise<void> {
    const [props, calculations] = body;
    const products = await this.productService.exportableCalculations(
      calculations
    );
    const xmlFile = this.service.toXmlWithParams(products, props, calculations);

    const filePath = '/tmp/export.xml';
    writeFileSync(filePath, xmlFile);
    res.download(filePath, err => {
      next(err);
    });
  }
}
