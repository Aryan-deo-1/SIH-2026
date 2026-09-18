import { StandardProduct } from '../types';

export interface ProductProvider {
  name: string;
  searchByBarcode(barcode: string): Promise<StandardProduct | null>;
  searchByName(query: string, brand?: string): Promise<StandardProduct[]>;
  searchByCategory(category: string): Promise<StandardProduct[]>;
  searchSimilar(product: StandardProduct): Promise<StandardProduct[]>;
  getProductById(externalId: string): Promise<StandardProduct | null>;
}
