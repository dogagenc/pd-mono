import * as em from 'exact-math';
import { get } from 'lodash';
import Product, { Calculation } from '../models/Product';
import PlatformService from '../services/PlatformService';
import MarketService from '../services/MarketService';
import SupplierService from '../services/SupplierService';
import ProductCategoryService from '../services/ProductCategoryService';
import { InjectorService } from '@tsed/di';
import Platform from '@src/models/Platform';
import Market from '@src/models/Market';

const injector = new InjectorService();
injector.load();

const exactMath: { [key: string]: (arg: any, arg2?: any) => number } = em;

export default class CalculationService {
  private platformService: PlatformService;
  private marketService: MarketService;
  private productCategoryService: ProductCategoryService;
  private supplierService: SupplierService;

  constructor(private product: Product) {
    this.platformService = injector.get(PlatformService);
    this.marketService = injector.get(MarketService);
    this.productCategoryService = injector.get(ProductCategoryService);
    this.supplierService = injector.get(SupplierService);
  }

  async check(next: () => void): Promise<void> {
    try {
      await this.calculateSupplier();
      await this.calculatePlatform();
      await this.calculateMarket();
    } catch (error) {
      console.log('calc', error); // eslint-disable-line
    }

    next();
  }

  private async calculateSupplier(): Promise<void> {
    if (!this.product.supplierInfos.length) {
      return this.removeCalculation('tedarikci');
    }

    const infoReses = this.product.supplierInfos.map(info =>
      exactMath.formula(
        `(${info.price} * (1 + (${info.vatPercentage} / 100))) + ${info.cargoPrice}`
      )
    );

    const maxIdx = infoReses.indexOf(Math.max(...infoReses));
    const supplierPublicId = this.product.supplierInfos[maxIdx]
      .supplierPublicId;

    const supplier = await this.supplierService.findOne({
      publicID: supplierPublicId
    });

    const result = {
      type: 'keys',
      minSupplier: supplier.name,
      minPrice: exactMath.ceil(infoReses[maxIdx], -2)
    };

    this.saveOrUpdateCalculation(result, 'tedarikci');
  }

  private async calculatePlatform(): Promise<void> {
    const { enabledPlatformIds } = this.product;

    const platformValues = enabledPlatformIds.map(p => p.value);

    if (!enabledPlatformIds.length) {
      this.removeCalculation('platform');
    }

    const platforms = await this.platformService.query({
      _id: { $in: platformValues }
    });

    const result = {};
    const setResult = (
      sellPrice: number,
      platform: Platform,
      sellType: string
    ): void => {
      result['type'] = 'array';
      result['platforms'] = result['platforms'] || [];

      const platformCalc = {
        name: platform.name.replace(/\s/g, ''),
        sellPrice: exactMath.ceil(sellPrice, -2),
        base: platform.baseMarket,
        reason: sellType
      };

      result['platforms'].push(platformCalc);
    };

    const setErrorResult = (platform: Platform, reason: string): void => {
      result['errors'] = result['errors'] || [];

      const error = {
        from: platform.name,
        reason
      };

      result['errors'].push(error);
    };

    for (const platform of platforms) {
      const minSupplierPrice = this.getCalculation('tedarikci', 'minPrice');
      const sellPrice = exactMath.formula(
        `${minSupplierPrice} * (1 + (${platform.marginOfSafety} + ${platform.minProfit}) / 100)`
      );

      if (!platform.baseMarket) {
        setResult(sellPrice, platform, 'Baz kendisi');
      } else {
        const marketPrice = this.product.prices.find(
          price => price.source === platform.baseMarket
        );

        if (!marketPrice) {
          setErrorResult(
            platform,
            `Bu isimli Pazaryerine ait fiyat bulunamadi: ${platform.baseMarket}`
          );
          continue;
        }

        const marketPrices = marketPrice.value.split(',').map(Number);

        let filteredMarketPrices = marketPrices.filter(
          price =>
            !this.product.regularPrice || this.product.regularPrice > price
        );

        filteredMarketPrices = filteredMarketPrices.filter(
          price => price > minSupplierPrice
        );
        filteredMarketPrices.sort();

        if (!filteredMarketPrices.length) {
          setResult(sellPrice, platform, `Baz: ${platform.baseMarket}-empty`);
        }

        if (filteredMarketPrices.length === 1) {
          const marketPrice = filteredMarketPrices[0];
          let newSellPrice;

          if (sellPrice < marketPrice) {
            newSellPrice = exactMath.formula(
              `${marketPrice} * ((100 - ${platform.competeRate}) / 100)`
            );
          } else {
            newSellPrice = sellPrice;
          }

          setResult(newSellPrice, platform, `Baz: ${platform.baseMarket}-1`);
        }

        if (filteredMarketPrices.length > 1) {
          const minPrice = filteredMarketPrices[0];
          const maxPrice =
            filteredMarketPrices[filteredMarketPrices.length - 1];

          const minMaxAverage = exactMath.formula(
            `(${minPrice} + ${maxPrice}) / 2`
          );
          const priceTotal = filteredMarketPrices.reduce(
            (ttl, price) => ttl + price,
            0
          );
          const priceAverage = exactMath.formula(
            `${priceTotal} / ${filteredMarketPrices.length}`
          );

          if (minMaxAverage > priceAverage) {
            const averageMedian = exactMath.formula(
              `(${minMaxAverage} + ${priceAverage}) / 2`
            );

            if (averageMedian >= sellPrice) {
              setResult(
                averageMedian,
                platform,
                'Platform satis fiyati < Coklu min-max ortalamasi > coklu fiyat ortalamasi'
              );
            } else {
              setResult(
                sellPrice,
                platform,
                'Platform satis fiyati > Coklu min-max ortalamasi'
              );
            }
          } else {
            if (priceAverage >= sellPrice) {
              setResult(
                priceAverage,
                platform,
                'Fiyat ortalamasi > Platform satis fiyati'
              );
            } else {
              setResult(
                sellPrice,
                platform,
                'Platform satis fiyati > Fiyat ortalamasi'
              );
            }
          }
        }
      }
    }

    this.saveOrUpdateCalculation(result, 'platform');
  }

  private async calculateMarket(): Promise<void> {
    const { enabledMarketIds } = this.product;

    if (!enabledMarketIds.length) {
      this.removeCalculation('pazaryeri');
      return;
    }

    const marketIds = enabledMarketIds.map(i => i.value);
    const markets = await this.marketService.query({
      _id: { $in: marketIds }
    });

    const productCategory = await this.productCategoryService.findOne({
      name: this.product.category
    });

    const result = {};
    const setResult = (
      sellPrice: number,
      market: Market,
      sellType: string,
      aggressive?: boolean
    ): void => {
      result['type'] = 'array';
      result['markets'] = result['markets'] || [];

      const marketCalc = {
        name: aggressive ? `${market.name}Aggressive` : market.name,
        sellPrice: exactMath.ceil(sellPrice, -2),
        base: market.baseMarket,
        reason: sellType
      };

      result['markets'].push(marketCalc);
    };

    const setErrorResult = (market: Market, reason: string): void => {
      result['errors'] = result['errors'] || [];

      const error = {
        from: market.name,
        reason
      };

      result['errors'].push(error);
    };

    for (const market of markets) {
      const category = productCategory.marketMappings.find(
        m => m.marketId == market._id
      );

      if (!category) {
        setErrorResult(
          market,
          `${market.name} marketine ve ${this.product.category} kategorisine ait komisyon ucreti bulunamadi`
        );
        continue;
      }

      const minSupplierPrice = this.getCalculation('tedarikci', 'minPrice');
      const calcSellPrice = (profit: number): number => {
        return exactMath.formula(
          `(((${minSupplierPrice} + (${minSupplierPrice} * ((${market.marginOfSafety} + ${profit}) / 100 ))) / (100 - ${category.feeRate})) * 100)`
        );
      };
      const sellPrice = calcSellPrice(market.minProfit);
      const aggresiveSellPrice = calcSellPrice(
        Number(market.aggresiveProfit) || 0
      );
      const price = this.product.prices.find(
        e => e.source === market.baseMarket || e.source === market.name
      );
      let marketPrices = price.value.split(',').map(p => Number(p));

      marketPrices = marketPrices.filter(
        price => !this.product.regularPrice || this.product.regularPrice > price
      );

      marketPrices = marketPrices.filter(price => price > minSupplierPrice);
      marketPrices.sort();

      if (aggresiveSellPrice) {
        const aggresivePrice = aggresiveSellPrice + market.competePrice;
        const prices = marketPrices.filter(p => p > aggresivePrice);

        if (!prices.length) {
          setResult(
            aggresiveSellPrice,
            market,
            'Agresif fiyat ustunde market fiyati yok',
            true
          );
        } else {
          if (prices[0] > aggresivePrice) {
            setResult(
              exactMath.formula(`${prices[0]} - ${market.competePrice}`),
              market,
              'Market baz fiyati agresif satis fiyatindan buyuk',
              true
            );
          } else {
            setResult(
              aggresiveSellPrice,
              market,
              'Agressive satis fiyati market en kucuk fiyatindan buyuk',
              true
            );
          }
        }
      }

      if (!marketPrices.length) {
        setResult(
          sellPrice,
          market,
          'Minimum maliyet + majin + kar + kategori komisyonu = minimum satis fiyati'
        );
        continue;
      }

      if (marketPrices.length === 1) {
        if (sellPrice + market.competePrice >= marketPrices[0]) {
          setResult(
            sellPrice,
            market,
            'Minimum satis fiyati + pazaryeri rekabet >= market fiyati'
          );
        } else {
          setResult(
            exactMath.formula(`${marketPrices[0]} - ${market.competePrice}`),
            market,
            'Pazaryeri satis fiyati - Pazaryeri rekabet degeri'
          );
        }

        continue;
      }

      if (marketPrices.length > 1) {
        const minPrice = marketPrices[0];
        const maxPrice = marketPrices[marketPrices.length - 1];

        const minMaxAverage = exactMath.formula(
          `(${minPrice} + ${maxPrice}) / 2`
        );
        const priceTotal = marketPrices.reduce((ttl, v) => ttl + v, 0);
        const priceAverage = exactMath.formula(
          `${priceTotal} / ${marketPrices.length}`
        );

        if (minMaxAverage >= priceAverage) {
          const averageMedian = exactMath.formula(
            `(${minMaxAverage} + ${priceAverage}) / 2`
          );

          if (averageMedian >= sellPrice) {
            setResult(
              averageMedian,
              market,
              '(minMax ort + fiyat ort) / 2 >= Minimum satis fiyati = ort / 2'
            );
          } else {
            setResult(
              sellPrice,
              market,
              '(minMax ort + fiyat ort) / 2 < minimum satis fiyati = minimum satis fiyati'
            );
          }
        } else {
          if (priceAverage >= sellPrice) {
            setResult(
              priceAverage,
              market,
              'fiyat ortalamasi >= minimum satis fiyati = fiyat ortalamasi'
            );
          } else {
            setResult(
              sellPrice,
              market,
              'fiyat ortalamasi < minimum satis fiyati = minimum satis fiyati'
            );
          }
        }
      }
    }

    this.saveOrUpdateCalculation(result, 'pazaryeri');
  }

  private saveOrUpdateCalculation(
    result: any,
    type: Calculation['type']
  ): void {
    const calculated = this.product.calculations.find(c => c.type === type);
    const createdAt = new Date(Date.now());

    if (calculated) {
      calculated.result = result;
      calculated.createdAt = createdAt;
    } else {
      const calc = {
        type,
        result,
        createdAt
      };

      this.product.calculations.push(calc);
    }
  }

  private getCalculation(type: Calculation['type'], path?: string): any {
    const calculation = this.product.calculations.find(c => {
      return c.type === type;
    });

    if (!calculation) return undefined;

    return path ? get(calculation.result, path) : calculation.result;
  }

  private removeCalculation(type: Calculation['type']): void {
    this.product.calculations.filter(c => c.type !== type);
  }
}
