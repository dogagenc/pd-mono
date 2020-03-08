// Platform
export interface Platform {
  id: string;
  name: string;
  marginOfSafety?: number;
  specialProductRate?: number;
  minProfit: number;
  competeRate: number;
  baseMarket: string;
}

// Supplier
interface Person {
  name: string;
  phone: string;
}

interface Bank {
  name: string;
  no: string;
  branch: string;
  iban: string;
}

export interface Supplier {
  id: string;
  name: string;
  publicID: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  contacts: Person[];
  banks: Bank[];
}

// Market
export interface Market {
  id: string;
  name: string;
  marginOfSafety: number;
  minProfit: number;
  baseMarket: string;
  competePrice: number;
  aggresiveProfit: number;
}

// Product Category
interface ProductCategoryMapping {
  marketId: string;
  category: string;
  feeRate: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  marketMappings: ProductCategoryMapping[];
}

// Cargo Group
interface CargoCompany {
  name: string;
  price: number;
}

interface CargoSupplier {
  supplierId: string;
  price: number;
}

export interface CargoGroup {
  id: string;
  name: string;
  cargoCompanies: CargoCompany[];
  suppliers: CargoSupplier[];
}

// Product
interface Price {
  source: string;
  value: string;
}

interface Value {
  value: string;
}

interface MarketUrl {
  name: string;
  url: string;
}

interface SupplierInfo {
  supplierPublicId: number;
  price: number;
  cargoPrice: number;
  vatPercentage: number;
  maturity: number;
  deliveryTime: number;
}

interface SellCalculation {
  name: string;
  sellPrice: 964.31;
  base: string;
}

interface CalculationError {
  from: string;
  reason: string;
}

interface Calculation {
  type: string;
  result: {
    type: string;
    platforms?: SellCalculation[];
    markets?: SellCalculation[];
    errors?: CalculationError[];
    minSupplier?: string;
    minPrice: number;
  };
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  skus: Value[];
  prices: Price[];
  regularPrice: number;
  cargoGroup: string;
  category: string;
  description: string;
  imageCount: number;
  imageFormat: string;
  enabledPlatformIds: Value[];
  enabledMarketIds: Value[];
  marketUrls: MarketUrl[];
  supplierInfos: SupplierInfo[];
  calculations: Calculation[];
}

// Models
export type Models =
  | Product
  | Platform
  | Supplier
  | Market
  | ProductCategory
  | CargoGroup;

// Status
interface StatusProgress {
  total: number;
  finished: number;
  percentage: number;
}

export interface ParserStatus {
  active: boolean;
  finished: boolean;
  type: string;
  startedAt: Date;
  progress: StatusProgress;
}
