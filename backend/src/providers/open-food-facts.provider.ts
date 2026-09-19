import axios from 'axios';
import { ProductProvider } from './product-provider.interface';
import { StandardProduct } from '../types';
import { NormalizationService } from '../services/normalization.service';

export class OpenFoodFactsProvider implements ProductProvider {
  public name = 'OpenFoodFactsProvider';

  // Multi-mirror array for resilience against 503s or downtime
  private mirrors = [
    'https://in.openfoodfacts.org/api/v2',
    'https://world.openfoodfacts.net/api/v2',
    'https://world.openfoodfacts.org/api/v2'
  ];

  private userAgent = 'PackCheck - Web - Version 1.0 - https://packcheck.app (contact: packcheck@example.com)';

  /**
   * Look up a product by exact barcode / GTIN from Open Food Facts
   * Returns null if not found. ZERO random or mock fallbacks!
   */
  public async searchByBarcode(barcode: string): Promise<StandardProduct | null> {
    const cleanBarcode = barcode.trim().replace(/\D/g, '');
    if (!cleanBarcode || cleanBarcode.length < 4) {
      return null;
    }

    for (const baseUrl of this.mirrors) {
      try {
        console.log(`[OpenFoodFacts] Querying ${baseUrl}/product/${cleanBarcode}.json`);
        const response = await axios.get(`${baseUrl}/product/${cleanBarcode}.json`, {
          timeout: 7000,
          headers: { 'User-Agent': this.userAgent }
        });

        if (response.data && (response.data.status === 1 || response.data.product)) {
          console.log(`[OpenFoodFacts] Found product "${response.data.product?.product_name || cleanBarcode}" on ${baseUrl}`);
          return NormalizationService.normalizeExternalProduct(response.data, 'Open Food Facts');
        }
      } catch (error: any) {
        console.warn(`[OpenFoodFacts] Mirror ${baseUrl} failed for ${cleanBarcode}:`, error.response?.status || error.message);
      }
    }

    // Try v0 fallback on in.openfoodfacts.org
    try {
      const v0Url = `https://in.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`;
      const response = await axios.get(v0Url, {
        timeout: 5000,
        headers: { 'User-Agent': this.userAgent }
      });
      if (response.data && (response.data.status === 1 || response.data.product)) {
        return NormalizationService.normalizeExternalProduct(response.data, 'Open Food Facts');
      }
    } catch (e: any) {
      // Ignore
    }

    // Product truly does not exist in Open Food Facts
    return null;
  }

  /**
   * Search Open Food Facts dynamically by keyword, brand, and/or variant
   * Returns empty array if none found. ZERO random or mock fallbacks!
   */
  public async searchByName(query: string, brand?: string): Promise<StandardProduct[]> {
    const cleanQuery = (query || '').trim();
    const cleanBrand = (brand || '').trim();

    if (!cleanQuery && !cleanBrand) {
      return [];
    }

    const brandToSearch = cleanBrand || cleanQuery;
    const brandSlug = brandToSearch.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    for (const baseUrl of this.mirrors) {
      try {
        // Strategy A: Search by brands_tags_en
        const brandUrl = `${baseUrl}/search?brands_tags_en=${encodeURIComponent(brandSlug)}&page_size=15`;
        console.log(`[OpenFoodFacts] Searching by brand: ${brandUrl}`);
        const brandRes = await axios.get(brandUrl, {
          timeout: 5000,
          headers: { 'User-Agent': this.userAgent }
        });

        if (brandRes.data && Array.isArray(brandRes.data.products) && brandRes.data.products.length > 0) {
          let candidates = brandRes.data.products.filter((p: any) => p && (p.product_name || p.product_name_en));

          // If a specific sub-query was also provided (e.g. "classic salted"), filter or rank
          if (cleanQuery && cleanBrand && cleanQuery.toLowerCase() !== cleanBrand.toLowerCase()) {
            const queryWords = cleanQuery.toLowerCase().split(/\s+/);
            const matching = candidates.filter((p: any) => {
              const fullText = `${p.product_name || ''} ${p.generic_name || ''}`.toLowerCase();
              return queryWords.some(w => fullText.includes(w));
            });
            if (matching.length > 0) {
              candidates = matching;
            }
          }

          const normalized: StandardProduct[] = [];
          for (const raw of candidates) {
            try {
              const norm = NormalizationService.normalizeExternalProduct(raw, 'Open Food Facts');
              if (norm) normalized.push(norm);
            } catch (err: any) {
              console.warn('[OpenFoodFacts] Normalization warning for candidate:', err?.message || err);
            }
          }
          if (normalized.length > 0) return normalized;
        }

        // Strategy B: If no brand match, search by categories_tags_en
        const categorySlug = cleanQuery.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const catUrl = `${baseUrl}/search?categories_tags_en=${encodeURIComponent(categorySlug)}&page_size=15`;
        console.log(`[OpenFoodFacts] Searching by category: ${catUrl}`);
        const catRes = await axios.get(catUrl, {
          timeout: 5000,
          headers: { 'User-Agent': this.userAgent }
        });

        if (catRes.data && Array.isArray(catRes.data.products) && catRes.data.products.length > 0) {
          const candidates = catRes.data.products.filter((p: any) => p && (p.product_name || p.product_name_en));
          const valid: StandardProduct[] = [];
          for (const raw of candidates) {
            try {
              const norm = NormalizationService.normalizeExternalProduct(raw, 'Open Food Facts');
              if (norm) valid.push(norm);
            } catch (err: any) {
              console.warn('[OpenFoodFacts] Normalization warning for category candidate:', err?.message || err);
            }
          }
          if (valid.length > 0) return valid;
        }
      } catch (err: any) {
        console.warn(`[OpenFoodFacts] Search non-fatal error on ${baseUrl}:`, err?.response?.status || err?.code || err?.message);
      }
    }

    return [];
  }

  /**
   * Search Open Food Facts dynamically by category slug
   */
  public async searchByCategory(category: string): Promise<StandardProduct[]> {
    const rawCat = (category || '').toLowerCase().trim();
    if (!rawCat || rawCat === 'all') return [];

    const categoryMap: Record<string, string> = {
      'chips': 'potato-crisps',
      'biscuits': 'biscuits',
      'peanut butter': 'peanut-butters',
      'cereal': 'breakfast-cereals',
      'milk': 'milks',
      'juice': 'fruit-juices',
      'instant noodles': 'instant-noodles',
      'protein products': 'high-protein-foods',
      'snacks': 'snacks'
    };

    const targetTag = categoryMap[rawCat] || rawCat.replace(/[^a-z0-9]/g, '-');

    for (const baseUrl of this.mirrors) {
      try {
        const catUrl = `${baseUrl}/search?categories_tags_en=${encodeURIComponent(targetTag)}&page_size=15`;
        console.log(`[OpenFoodFacts] Searching category on ${baseUrl}: ${catUrl}`);
        const response = await axios.get(catUrl, {
          timeout: 7000,
          headers: { 'User-Agent': this.userAgent }
        });

        if (response.data && Array.isArray(response.data.products) && response.data.products.length > 0) {
          const valid = response.data.products
            .filter((p: any) => p.product_name || p.product_name_en)
            .map((raw: any) => NormalizationService.normalizeExternalProduct(raw, 'Open Food Facts'));

          if (valid.length > 0) return valid;
        }
      } catch (err: any) {
        console.warn(`[OpenFoodFacts] Category search error on ${baseUrl}:`, err.response?.status || err.message);
      }
    }

    return [];
  }

  /**
   * Search for similar products in the same category from Open Food Facts
   */
  public async searchSimilar(product: StandardProduct): Promise<StandardProduct[]> {
    const categorySlug = (product.category || 'snacks').toLowerCase().replace(/\s+/g, '-');

    for (const baseUrl of this.mirrors) {
      try {
        const searchUrl = `${baseUrl}/search?categories_tags_en=${encodeURIComponent(categorySlug)}&page_size=8`;
        const response = await axios.get(searchUrl, {
          timeout: 6000,
          headers: { 'User-Agent': this.userAgent }
        });

        if (response.data && Array.isArray(response.data.products)) {
          const valid = response.data.products
            .filter((p: any) => (p.code || p.id) !== product.barcodeGtIN && (p.product_name || p.product_name_en))
            .map((raw: any) => NormalizationService.normalizeExternalProduct(raw, 'Open Food Facts'));

          if (valid.length > 0) {
            return valid;
          }
        }
      } catch (err: any) {
        console.warn(`[OpenFoodFacts] searchSimilar error on ${baseUrl}:`, err.response?.status || err.message);
      }
    }

    return [];
  }

  /**
   * Get product by external ID / code
   */
  public async getProductById(externalId: string): Promise<StandardProduct | null> {
    return this.searchByBarcode(externalId);
  }
}
