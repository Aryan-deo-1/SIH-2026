import { ProductProvider } from './product-provider.interface';
import { StandardProduct } from '../types';
import { OpenFoodFactsProvider } from './open-food-facts.provider';

/**
 * ExternalProductProvider delegates directly to OpenFoodFactsProvider
 * with ZERO mock fallbacks.
 */
export class ExternalProductProvider implements ProductProvider {
  public name = 'ExternalProductProvider (OpenFoodFacts)';
  private delegate: OpenFoodFactsProvider;

  constructor() {
    this.delegate = new OpenFoodFactsProvider();
  }

  public async searchByBarcode(barcode: string): Promise<StandardProduct | null> {
    return this.delegate.searchByBarcode(barcode);
  }

  public async searchByName(query: string, brand?: string): Promise<StandardProduct[]> {
    return this.delegate.searchByName(query, brand);
  }

  public async searchByCategory(category: string): Promise<StandardProduct[]> {
    return this.delegate.searchByCategory(category);
  }

  public async searchSimilar(product: StandardProduct): Promise<StandardProduct[]> {
    return this.delegate.searchSimilar(product);
  }

  public async getProductById(externalId: string): Promise<StandardProduct | null> {
    return this.delegate.getProductById(externalId);
  }
}
