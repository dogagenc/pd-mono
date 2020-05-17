import axios, { AxiosPromise } from 'axios';
import config from '@/config';
import {
  CargoGroup,
  Market,
  Platform,
  ProductCategory,
  Supplier,
  ParserStatus,
  Product
} from '@/types/app';

const api = axios.create({
  baseURL: config('API_URL')
});

api.interceptors.response.use(
  res => res,
  error => {
    let rejected = error.message;

    if (error.response) {
      rejected = error.response.data;
    }

    return Promise.reject(new Error(rejected));
  }
);

export interface PaginatedReturnValue<T> {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  pagingCounter: number;
}

export const uploadFile = async (file: File): Promise<ParserStatus> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post('upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data;
};

export const getUploadStatus = async (): Promise<ParserStatus> => {
  const { data } = await api.get('upload');

  return data;
};

const downloadFile = (data: BlobPart, fileName: string): void => {
  const url = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
};

export const downloadXml = async (type: string): Promise<void> => {
  const { data } = await api.get('upload/export', {
    params: { type },
    responseType: 'blob'
  });

  downloadFile(data, `${type}-hesaplama.xml`);
};

export const downloadXmlBySelections = async (
  props: any[],
  calculations: any[]
) => {
  const { data } = await api.post('upload/export', [props, calculations], {
    responseType: 'blob'
  });

  downloadFile(
    data,
    `export-${new Date()
      .toDateString()
      .split(' ')
      .join('-')}.xml`
  );
};

export const getRecalculateStatus = async () => {
  const { data } = await api.get('upload/recalculate');

  return data;
};

export const recalculateProducts = async () => {
  const { data } = await api.post('upload/recalculate');

  return data;
};

export class ApiService<T> {
  constructor(public base: string) {}

  async wrapper<S>(method: AxiosPromise): Promise<S> {
    const res = await method;
    return res.data;
  }

  async paginate(page: number, filters?: {}) {
    return this.wrapper<PaginatedReturnValue<T>>(
      api.get(this.base, { params: { page, filters } })
    );
  }

  async getAll() {
    return this.wrapper<T[]>(api.get(this.base));
  }

  async get(id: string) {
    return this.wrapper<T>(api.get(`${this.base}/${id}`));
  }

  async post(payload: Partial<T>) {
    return this.wrapper<T>(api.post(this.base, payload));
  }

  async put(payload: Partial<T>) {
    return this.wrapper<T>(api.put(this.base, payload));
  }

  async delete(id: string) {
    return api.delete(`${this.base}/${id}`);
  }
}

export const platformService = new ApiService<Platform>('platforms');
export const supplierService = new ApiService<Supplier>('suppliers');
export const marketService = new ApiService<Market>('markets');
export const productCategoryService = new ApiService<ProductCategory>(
  'product-categories'
);
export const cargoGroupService = new ApiService<CargoGroup>('cargo-groups');
export const productService = new ApiService<Product>('products');
