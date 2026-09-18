import { ProductProvider } from '../providers/product-provider.interface';
import { OpenFoodFactsProvider } from '../providers/open-food-facts.provider';
import { MockProductProvider } from '../providers/mock-product.provider';
import { StandardProduct } from '../types';
import { dbService } from './db.service';

export class ExternalProductService {
  private provider: ProductProvider;

  constructor() {
    // Only use mock provider if explicitly configured in environment (e.g. offline testing)
    if (process.env.USE_MOCK_PROVIDER === 'true') {
      console.log('[ExternalProductService] Initialized with MockProductProvider');
      this.provider = new MockProductProvider();
    } else {
      console.log('[ExternalProductService] Initialized with OpenFoodFactsProvider as primary provider');
      this.provider = new OpenFoodFactsProvider();
    }
  }

  /**
   * Searches external provider by barcode, caches the product if found, and returns normalized product.
   * Returns null if not found. ZERO random fallbacks!
   */
  public async searchByBarcode(barcode: string): Promise<StandardProduct | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;

    console.log(`[ExternalProductService] Querying external provider for barcode: ${cleanBarcode}`);
    const externalProduct = await this.provider.searchByBarcode(cleanBarcode);

    if (externalProduct) {
      console.log(`[ExternalProductService] Discovered external product: "${externalProduct.name}". Caching in DB...`);
      const cached = await this.cacheProduct(externalProduct);
      return cached;
    }

    console.log(`[ExternalProductService] Barcode ${cleanBarcode} not found in external provider.`);
    return null;
  }

  /**
   * Searches external provider by product name and/or brand, caches results, and returns list.
   */
  public async searchByName(query: string, brand?: string): Promise<StandardProduct[]> {
    const clean = query.trim();
    if (!clean && !brand) return [];

    console.log(`[ExternalProductService] Querying external provider for name: "${clean}", brand: "${brand || ''}"`);
    const results = await this.provider.searchByName(clean, brand);

    if (results.length > 0) {
      console.log(`[ExternalProductService] Discovered ${results.length} external products matching query. Caching...`);
      const cachedList = await Promise.all(
        results.slice(0, 10).map((prod) => this.cacheProduct(prod))
      );
      return cachedList;
    }

    return [];
  }

  /**
   * Searches external provider by category, caches results, and returns list.
   */
  public async searchByCategory(category: string): Promise<StandardProduct[]> {
    const cleanCat = (category || '').trim();
    if (!cleanCat || cleanCat === 'ALL') return [];

    console.log(`[ExternalProductService] Querying external provider for category: "${cleanCat}"`);
    const results = await this.provider.searchByCategory(cleanCat);

    if (results.length > 0) {
      console.log(`[ExternalProductService] Discovered ${results.length} external products in category "${cleanCat}". Caching...`);
      const cachedList = await Promise.all(
        results.slice(0, 10).map((prod) => this.cacheProduct(prod))
      );
      return cachedList;
    }

    return [];
  }

  /**
   * Searches external provider for similar products in the same category
   */
  public async searchSimilar(product: StandardProduct): Promise<StandardProduct[]> {
    console.log(`[ExternalProductService] Searching similar products for category: "${product.category}"`);
    const results = await this.provider.searchSimilar(product);

    if (results.length > 0) {
      const cachedList = await Promise.all(
        results.slice(0, 5).map((prod) => this.cacheProduct(prod))
      );
      return cachedList;
    }

    return [];
  }

  /**
   * Caches normalized external product into PostgreSQL / DB service
   */
  public async cacheProduct(product: StandardProduct): Promise<StandardProduct> {
    try {
      const saved = await dbService.saveProduct({
        ...product,
        sourceType: 'EXTERNAL_CACHE',
        sourceName: 'Open Food Facts'
      });
      return saved;
    } catch (err) {
      console.warn('[ExternalProductService] Cache save error, using in-memory object:', err);
      return product;
    }
  }
}

export const externalProductService = new ExternalProductService();
