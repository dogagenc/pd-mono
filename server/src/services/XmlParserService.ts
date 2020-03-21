import { get, pickBy, uniqBy, filter, set } from 'lodash';
import { Service } from '@tsed/common';
import { Builder, parseStringPromise } from 'xml2js';
import asyncPool from 'tiny-async-pool';
import Product, { Calculation, Value } from '../models/Product';
import ProductService from './ProductService';
import PlatformService from './PlatformService';
import MarketService from './MarketService';
import { BadRequest } from 'ts-httpexceptions';
import { ExportOptionsProp, ExportOptionsCalculation } from '../ExportOptions';

enum Keys {
  Supplier = 'tedarikci-fiyat',
  Akakce = 'akakce-fiyat',
  Trendyol = 'trendyol-fiyat',
  Product = 'urunler'
}

interface Record {
  [key: string]: [string];
}

interface XML {
  [key: string]: {
    $: { [key: string]: string };
    record: Record[];
  };
}

interface Mapper {
  mapValue: (key: string, type?: any) => any; // eslint-disable-line
  mapValues: (startsWith: string, type?: any) => any; // eslint-disable-line
  mapBoolean: (key: string) => boolean;
  mapSellingPartIds: (
    startsWith: string,
    service: PlatformService | MarketService
  ) => Promise<Value[]>;
}

interface StatusProgress {
  total: number;
  finished: number;
  percentage: number;
}

export interface ParserStatus {
  active: boolean;
  finished: boolean;
  type: string;
  startedAt: number;
  finishedAt?: Date;
  progress: StatusProgress;
}

@Service()
export default class XmlParserService {
  constructor(
    private productService: ProductService,
    private platformService: PlatformService,
    private marketService: MarketService
  ) {}
  private status: ParserStatus = {
    finished: false,
    active: false,
    type: '',
    startedAt: Date.now(),
    progress: {
      total: 0,
      finished: 0,
      percentage: 0
    }
  };

  private setStatus(path: string, value: any): ParserStatus {
    return set(this.status, path, value);
  }

  getStatus(path?: string): any {
    return path ? get(this.status, path) : this.status;
  }

  toXml(products: Product[], type: string): XML {
    const key = `${type}-hesaplama`;
    const obj = {
      [key]: {
        $: '',
        record: []
      }
    };
    const builder = new Builder();

    const getCalculation = (
      product: Product,
      type: string
    ): { result: any } => {
      return product.calculations.find(c => c.type === type);
    };

    const maps = {
      tedarikci: {
        MinimumToplamMaliyet: (calculation: Calculation): any =>
          calculation.result.minPrice,
        MinimumMaliyetVerenTedarikci: (calculation: Calculation): any =>
          calculation.result.minSupplier
      },
      platform: {}
    };

    products.forEach(product => {
      const record: { [key: string]: any[] } = {};

      record.Product = [product.name];
      record.SKU = [product.sku];

      const map = maps[type];
      const calculation = getCalculation(product, type);

      if (!calculation) return;

      Object.keys(map).forEach(key => {
        record[key] = [map[key].call(null, calculation)];
      });

      obj[key].record.push(record);
    });

    return builder.buildObject(obj);
  }

  toXmlWithParams(
    products: Product[],
    props: ExportOptionsProp[],
    calculations: ExportOptionsCalculation[]
  ): XML {
    const key = 'export';
    const obj = {
      [key]: {
        $: '',
        record: []
      }
    };
    const builder = new Builder();

    const getCalculation = (product: Product, type: string): Calculation => {
      return product.calculations.find(c => c.type === type);
    };

    products.forEach(product => {
      const record: { [key: string]: any[] } = {};

      props.forEach(prop => {
        record[prop.xmlKey] = product[prop.key];
      });

      try {
        calculations.forEach(calculation => {
          const calc = getCalculation(product, calculation.type);
          const resType = calc.result.type;

          if (resType === 'keys') {
            record[calculation.xmlKey] = calc.result[calculation.key];
          } else if (resType === 'array') {
            const items =
              calc.type === 'platform'
                ? calc.result.platforms
                : calc.result.markets;
            const [item] = items.filter(i => {
              return i.name === calculation.selectedName;
            });

            if (!item) {
              throw new Error('No err');
            }

            record[calculation.xmlKey] = item[calculation.key];
          }
        });

        obj[key].record.push(record);
      } catch (e) {} // eslint-disable-line
    });

    return builder.buildObject(obj);
  }

  private clearStatus(): void {
    this.status = {
      finished: false,
      active: false,
      type: '',
      startedAt: Date.now(),
      progress: {
        total: 0,
        finished: 0,
        percentage: 0
      }
    };
  }

  private increaseProgress(): void {
    const path = 'progress.finished';
    const finished = this.getStatus(path);
    this.setStatus(path, finished + 1);
  }

  async parse(xmlBuffer: Buffer): Promise<ParserStatus> {
    if (this.status.active) {
      throw new Error('There is already running parser!');
    }

    try {
      const xml = await parseStringPromise(xmlBuffer);
      const type = this.getType(xml);

      this.startParser(type, xml).catch(err => {
        throw err;
      });
      this.setStatus('type', type);
      this.setStatus('active', true);

      return this.getStatus();
    } catch (error) {
      console.log('error', error); // eslint-disable-line
      throw new BadRequest(error);
    }
  }

  private getType(xml: XML): Keys {
    const [key] = Object.keys(xml);
    return key as Keys;
  }

  private async startParser(type: Keys, xml: XML): Promise<void> {
    const parsers = {
      [Keys.Supplier]: this.parseSupplier,
      [Keys.Akakce]: this.parseAkakce,
      [Keys.Trendyol]: this.parseTrendyol,
      [Keys.Product]: this.parseProduct
    };

    const parser = parsers[type];

    if (!parser) {
      throw new Error(
        `${type} key is not found on parsers: ${Object.keys(parsers)}`
      );
    }

    this.clearStatus();
    await parser.call(this, xml);
    this.setStatus('active', false);
  }
  private parseSupplier(xml: XML): Promise<void[]> {
    return this.poolOperationOnRecords(
      xml,
      Keys.Supplier,
      100,
      async record => {
        const { mapValue } = this.createMapper(record);

        const product: Partial<Product> = {
          name: mapValue('Product'),
          sku: mapValue('SKU1')
        };

        const supplierInfo: Product['supplierInfos'][0] = {
          supplierPublicId: mapValue('TedarikciID'),
          price: mapValue('AlisFiyati', Number),
          cargoPrice: mapValue('KargoFiyati', Number),
          vatPercentage: mapValue('KDV', Number),
          maturity: mapValue('TedarikciVadesi', Number),
          deliveryTime: mapValue('TeslimatSuresi', Number)
        };

        const existingProduct = await this.productService.findOne({
          sku: product.sku
        });

        if (existingProduct) {
          existingProduct.supplierInfos = uniqBy(
            [...(existingProduct.supplierInfos || []), supplierInfo],
            'supplierPublicId'
          );
          await this.productService.save(existingProduct);
        } else {
          const newProduct: Partial<Product> = {
            ...product,
            supplierInfos: [supplierInfo]
          };

          await this.productService.save(newProduct);
        }

        this.increaseProgress();
      }
    );
  }

  private parseAkakce(xml: XML): Promise<void[]> {
    return this.poolOperationOnRecords(xml, Keys.Akakce, 100, async record => {
      const { mapValues, mapValue } = this.createMapper(record);

      const product = {
        sku: mapValue('SKU1'),
        name: mapValue('Product')
      };
      const marketUrl = {
        name: 'Akakce',
        url: mapValue('AkakceURL')
      };
      const price = {
        source: 'Akakce',
        value: mapValues('Fiyat').join(',')
      };

      const existingProduct = await this.productService.findOne({
        sku: product.sku
      });

      if (existingProduct) {
        existingProduct.marketUrls = uniqBy(
          [...(existingProduct.marketUrls || []), marketUrl],
          'name'
        );
        existingProduct.prices = uniqBy(
          [...(existingProduct.prices || []), price],
          'source'
        );
        await this.productService.save(existingProduct);
      } else {
        const newProduct: Partial<Product> = {
          ...product,
          marketUrls: [marketUrl],
          prices: [price]
        };

        await this.productService.save(newProduct);
      }

      this.increaseProgress();
    });
  }

  private parseTrendyol(xml: XML): Promise<void[]> {
    return this.poolOperationOnRecords(
      xml,
      Keys.Trendyol,
      100,
      async record => {
        const { mapValue } = this.createMapper(record);

        const product = {
          name: mapValue('Product'),
          sku: mapValue('SKU1')
        };

        const marketUrl = {
          name: 'Trendyol',
          url: mapValue('TrendyolURL')
        };

        const price = {
          source: 'Trendyol',
          value: mapValue('TrendyolFiyat')
        };

        const existingProduct = await this.productService.findOne({
          sku: product.sku
        });

        if (existingProduct) {
          existingProduct.marketUrls = uniqBy(
            [...(existingProduct.marketUrls || []), marketUrl],
            'name'
          );
          existingProduct.prices = uniqBy(
            [...(existingProduct.prices || []), price],
            'source'
          );
          await this.productService.save(existingProduct);
        } else {
          const newProduct: Partial<Product> = {
            ...product,
            marketUrls: [marketUrl],
            prices: [price]
          };

          await this.productService.save(newProduct);
        }

        this.increaseProgress();
      }
    );
  }

  private parseProduct(xml: XML): Promise<void[]> {
    return this.poolOperationOnRecords(xml, Keys.Product, 100, async record => {
      const { mapValue, mapSellingPartIds } = this.createMapper(record);

      const product = pickBy(
        {
          name: mapValue('Product'),
          brand: mapValue('Brand'),
          sku: mapValue('SKU1'),
          regularPrice: mapValue('RegularPrice', Number),
          description: mapValue('Description'),
          category: mapValue('Category'),
          imageCount: mapValue('ImageCount', Number),
          imageFormat: mapValue('ImageFormat'),
          cargoGroup: mapValue('CargoGroup')
        },
        value => !!value
      );

      const marketUrls: { name: string; url: string }[] = filter(
        [
          {
            name: 'Akakce',
            url: mapValue('AkakceURL')
          },
          {
            name: 'Cimri',
            url: mapValue('CimriURL')
          },
          {
            name: 'Hepsiburada',
            url: mapValue('HepsiburadaURL')
          },
          {
            name: 'Trendyol',
            url: mapValue('TrendyolURL')
          }
        ],
        market => !!market.url
      );

      const enabledPlatformIds = await mapSellingPartIds(
        'SatisPlatform',
        this.platformService
      );
      const enabledMarketIds = await mapSellingPartIds(
        'SatisPazaryeri',
        this.marketService
      );

      const existingProduct = await this.productService.findOne({
        sku: product.sku
      });

      if (existingProduct) {
        const updatedProduct = {
          ...existingProduct,
          ...product
        };

        updatedProduct.enabledPlatformIds = uniqBy(
          [
            ...(existingProduct.enabledPlatformIds || []),
            ...enabledPlatformIds
          ],
          'value'
        );

        updatedProduct.enabledMarketIds = uniqBy(
          [...(existingProduct.enabledMarketIds || []), ...enabledMarketIds],
          'value'
        );

        updatedProduct.marketUrls = uniqBy(
          [...(existingProduct.marketUrls || []), ...marketUrls],
          'name'
        );

        this.productService.save(updatedProduct);
      } else {
        const newProduct = {
          ...product,
          enabledMarketIds,
          marketUrls
        };

        await this.productService.save(newProduct);
      }

      this.increaseProgress();
    });
  }

  private poolOperationOnRecords(
    xml: XML,
    key: string,
    limit = 10,
    iterateFn: (record: Record) => Promise<void>
  ): Promise<void[]> {
    const records = xml[key].record;
    this.setStatus('progress.total', records.length);

    return asyncPool(limit, records, iterateFn);
  }

  private createMapper(record: Record): Mapper {
    const mapValue = (key: string, type?: any): any => {
      const value = record[key] && record[key][0];

      if (!value) return undefined;
      if (!type) return value;
      if (type === Number) return Number(value);
      if (type === Boolean) return value === 'true';

      return value;
    };

    const mapValues = (startsWith: string, type?: any): any[] => {
      const values = Object.keys(record)
        .filter(key => key.startsWith(startsWith) && record[key][0])
        .map(key => record[key][0]);

      if (!type) return values;
      if (type === Number) return values.map(Number);
      if (type === Boolean) return values.map(value => value === 'true');

      return values;
    };

    const mapBoolean = (key: string): boolean => {
      const value = record[key][0];

      return value === 'Evet';
    };

    const mapSellingPartIds = async (
      startsWith: string,
      service: PlatformService | MarketService
    ): Promise<Value[]> => {
      const names = Object.keys(record)
        .filter(
          key =>
            key.startsWith(startsWith) &&
            record[key][0] &&
            record[key][0] === 'Evet'
        )
        .map(key => key.replace(startsWith, ''));

      const docs: {
        _id: {
          toString(): string;
        };
      }[] = await service.query({
        name: { $in: names }
      });

      const values = docs.map(doc => ({ value: doc._id.toString() }));

      return values;
    };

    return { mapValue, mapValues, mapBoolean, mapSellingPartIds };
  }
}
