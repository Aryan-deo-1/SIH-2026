import { ProductProvider } from './product-provider.interface';
import { StandardProduct } from '../types';
import { SEED_PRODUCTS } from '../data/seed-data';
import { NormalizationService } from '../services/normalization.service';

export class MockProductProvider implements ProductProvider {
  public name = 'MockProductProvider';
  private products: StandardProduct[] = [];

  constructor() {
    this.initMockProducts();
  }

  private initMockProducts() {
    this.products = SEED_PRODUCTS.map((p, idx) => ({
      id: `mock-${idx + 1}`,
      name: p.name,
      brand: p.brand,
      category: p.category,
      manufacturer: p.manufacturer,
      barcodeGtIN: p.barcodeGtIN,
      packSize: p.packSize,
      price: p.price,
      imageUrl: p.imageUrl,
      countryOfOrigin: p.countryOfOrigin,
      sourceType: 'INTERNAL',
      sourceName: 'Mock Demo Provider',
      externalProductId: p.barcodeGtIN,
      nutrition: { ...p.nutrition },
      ingredient: {
        ingredientText: p.ingredient.ingredientText,
        allergens: p.ingredient.allergens
      },
      verification: p.verification
        ? {
            authority: p.verification.authority,
            identifier: p.verification.identifier,
            status: p.verification.status as any,
            evidenceType: p.verification.evidenceType,
            sourceUrl: p.verification.sourceUrl,
            details: p.verification.details
          }
        : undefined,
      certifications: p.certifications || []
    }));
  }

  public async searchByBarcode(barcode: string): Promise<StandardProduct | null> {
    const clean = barcode.trim();
    const found = this.products.find((p) => p.barcodeGtIN === clean);
    return found ? { ...found } : null;
  }

  public async searchByName(name: string, category?: string): Promise<StandardProduct[]> {
    const q = name.toLowerCase().trim();
    return this.products
      .filter((p) => {
        const matchName = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
        const matchCat = !category || category === 'ALL' || p.category.toLowerCase() === category.toLowerCase();
        return matchName && matchCat;
      })
      .map((p) => ({ ...p }));
  }

  public async searchByCategory(category: string): Promise<StandardProduct[]> {
    const cat = category.toLowerCase().trim();
    return this.products
      .filter((p) => !cat || cat === 'all' || p.category.toLowerCase() === cat)
      .map((p) => ({ ...p }));
  }

  public async searchSimilar(product: StandardProduct): Promise<StandardProduct[]> {
    return this.products
      .filter((p) => p.id !== product.id && p.category.toLowerCase() === product.category.toLowerCase())
      .map((p) => ({ ...p }));
  }

  public async getProductById(externalId: string): Promise<StandardProduct | null> {
    return this.searchByBarcode(externalId);
  }
}
