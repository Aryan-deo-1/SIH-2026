import { StandardProduct, StandardNutrition, StandardIngredient, StandardVerification } from '../types';

/**
 * Normalization Service
 * 1. Handles external product normalization (e.g. Open Food Facts API payloads into StandardProduct)
 * 2. Handles text normalization, case insensitivity, OCR noise correction, tokenization,
 *    and fuzzy string matching for product search & scanning.
 */
export class NormalizationService {
  // ==========================================
  // SECTION 1: SEARCH & TEXT NORMALIZATION
  // ==========================================

  /**
   * Cleans and standardizes a search query string.
   * Lowercases, strips punctuation (apostrophes, quotes, dashes, etc.),
   * and collapses consecutive whitespace.
   * Example: "LAY'S!" -> "lays", "lays  chips" -> "lays chips"
   */
  public static cleanSearchQuery(query: string): string {
    if (!query) return '';
    return query
      .toLowerCase()
      .replace(/['’`"]/g, '') // remove apostrophes and quotes: Lay's -> Lays
      .replace(/[^a-z0-9\s]/g, ' ') // replace other punctuation with space
      .replace(/\s+/g, ' ') // collapse multiple spaces
      .trim();
  }

  /**
   * Splits a search string into individual clean alphanumeric tokens.
   * Example: "Lays Classic 50g" -> ["lays", "classic", "50g"]
   */
  public static tokenize(text: string): string[] {
    const cleaned = this.cleanSearchQuery(text);
    if (!cleaned) return [];
    return cleaned
      .split(' ')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  /**
   * Fixes common OCR letter/digit confusions in raw text.
   * e.g. "LAY5 CLASSlC" -> "LAYS CLASSIC"
   * e.g. "500 9" -> "500 g"
   */
  public static cleanOcrText(rawText: string): string {
    if (!rawText) return '';
    let cleaned = rawText;

    // In upper-case words: '5' often represents 'S' (e.g. LAY5 -> LAYS, 5ALTED -> SALTED)
    cleaned = cleaned.replace(/\b([A-Z]*)(5)([A-Z]+)\b/g, '$1S$3');
    cleaned = cleaned.replace(/\b([A-Z]+)(5)([A-Z]*)\b/g, '$1S$3');

    // In upper-case words: '0' often represents 'O' (e.g. P0TAT0 -> POTATO)
    cleaned = cleaned.replace(/\b([A-Z]*)(0)([A-Z]+)\b/g, '$1O$3');
    cleaned = cleaned.replace(/\b([A-Z]+)(0)([A-Z]*)\b/g, '$1O$3');

    // In upper-case words: '1' or '|' often represents 'I' or 'L' (e.g. CLASSlC -> CLASSIC)
    cleaned = cleaned.replace(/\b([A-Z]*)l([A-Z]+)\b/g, '$1I$2');

    // Net weight OCR substitution: "500 9" or "100 9" -> "500 g" or "100 g"
    cleaned = cleaned.replace(/(\d+)\s*9\b/g, '$1 g');

    return cleaned;
  }

  /**
   * Computes the Levenshtein distance between two strings.
   */
  public static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Computes normalized similarity between two strings (0.0 to 1.0).
   */
  public static stringSimilarity(a: string, b: string): number {
    const s1 = this.cleanSearchQuery(a);
    const s2 = this.cleanSearchQuery(b);
    if (!s1 || !s2) return 0;
    if (s1 === s2) return 1.0;

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1.0;

    const dist = this.levenshteinDistance(s1, s2);
    return Math.max(0, 1 - dist / maxLen);
  }

  /**
   * Evaluates how well a query matches a product record.
   * Returns a match score from 0 to 100, where >= 40 indicates a valid match.
   */
  public static scoreProductMatch(
    query: string,
    product: { name: string; brand: string; category?: string; barcodeGtIN?: string | null }
  ): number {
    const cleanQ = this.cleanSearchQuery(query);
    if (!cleanQ) return 100;

    const prodName = this.cleanSearchQuery(product.name);
    const prodBrand = this.cleanSearchQuery(product.brand);
    const prodCategory = this.cleanSearchQuery(product.category || '');
    const barcode = (product.barcodeGtIN || '').trim();

    // 1. Exact barcode match: 100
    if (barcode && (cleanQ === barcode || query.includes(barcode))) {
      return 100;
    }

    // 2. Exact brand match: 95
    if (cleanQ === prodBrand) {
      return 95;
    }

    // 3. Exact full name match: 90
    if (cleanQ === prodName) {
      return 90;
    }

    // 4. Product name starts with query: 85
    if (prodName.startsWith(cleanQ) || prodBrand.startsWith(cleanQ)) {
      return 85;
    }

    // 5. Product name contains query: 80
    if (prodName.includes(cleanQ) || prodBrand.includes(cleanQ)) {
      return 80;
    }

    // 6. Token-based matching: check if all query tokens appear in the product
    const queryTokens = this.tokenize(query);
    if (queryTokens.length > 0) {
      const combined = `${prodName} ${prodBrand} ${prodCategory} ${barcode}`;
      const allTokensMatch = queryTokens.every((token) => combined.includes(token));

      if (allTokensMatch) {
        return 75;
      }

      // Partial token match (e.g. 2 of 3 tokens match)
      const matchedTokens = queryTokens.filter((token) => combined.includes(token));
      const matchRatio = matchedTokens.length / queryTokens.length;
      if (matchRatio >= 0.6) {
        return Math.round(50 * matchRatio);
      }
    }

    // 7. Fuzzy similarity on brand or name
    const brandSim = this.stringSimilarity(cleanQ, prodBrand);
    const nameSim = this.stringSimilarity(cleanQ, prodName);
    const maxSim = Math.max(brandSim, nameSim);

    if (maxSim >= 0.75) {
      return Math.round(maxSim * 70);
    }

    return 0;
  }

  // ==========================================
  // SECTION 2: OPEN FOOD FACTS NORMALIZATION
  // ==========================================

  /**
   * Normalizes raw response from Open Food Facts API into StandardProduct
   */
  public static normalizeExternalProduct(raw: any, provider: string = 'Open Food Facts'): StandardProduct {
    const p = raw.product || raw;
    const nutriments = p.nutriments || {};

    // 1. Calories extraction
    let caloriesVal =
      nutriments['energy-kcal_100g'] ??
      nutriments['energy-kcal'] ??
      nutriments['energy-kcal_value'] ??
      nutriments['energy-kcal_serving'];

    if (caloriesVal === undefined) {
      const energyJoules = nutriments['energy_100g'] ?? nutriments['energy'] ?? nutriments['energy_value'];
      if (energyJoules !== undefined && energyJoules > 0) {
        // Convert kJ to kcal
        caloriesVal = energyJoules / 4.184;
      }
    }

    // 2. Macronutrients
    const nutrition: StandardNutrition = {
      servingSize: p.serving_size || (p.serving_quantity ? `${p.serving_quantity}g` : '100g'),
      calories: this.parseNumber(caloriesVal),
      protein: this.parseNumber(nutriments.proteins_100g ?? nutriments.proteins ?? nutriments.protein_g ?? nutriments.protein),
      carbohydrates: this.parseNumber(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? nutriments.carbs_g),
      sugar: this.parseNumber(nutriments.sugars_100g ?? nutriments.sugars ?? nutriments.sugar),
      addedSugar: this.parseNumber(nutriments['added-sugars_100g'] ?? nutriments.added_sugars ?? nutriments['added-sugars']),
      fat: this.parseNumber(nutriments.fat_100g ?? nutriments.fat ?? nutriments.total_fat),
      saturatedFat: this.parseNumber(nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat'] ?? nutriments.saturated_fat),
      transFat: this.parseNumber(nutriments['trans-fat_100g'] ?? nutriments['trans-fat'] ?? nutriments.trans_fat ?? 0),
      fiber: this.parseNumber(nutriments.fiber_100g ?? nutriments.fiber ?? nutriments.fibre),
      sodium: this.parseSodium(nutriments.sodium_100g ?? nutriments.sodium ?? nutriments.salt_100g, !!nutriments.salt_100g && nutriments.sodium_100g === undefined),
      calcium: this.parseNumber(nutriments.calcium_100g ? nutriments.calcium_100g * 1000 : nutriments.calcium),
      iron: this.parseNumber(nutriments.iron_100g ? nutriments.iron_100g * 1000 : nutriments.iron)
    };

    // 3. Ingredients & allergens
    const ingredientText =
      p.ingredients_text ||
      p.ingredients_text_en ||
      (Array.isArray(p.ingredients) ? p.ingredients.map((i: any) => i.text).join(', ') : 'Ingredient details not available on package record.');

    const allergens: string[] = [];
    if (p.allergens_tags && Array.isArray(p.allergens_tags)) {
      p.allergens_tags.forEach((tag: string) => {
        allergens.push(tag.replace('en:', '').replace(/-/g, ' '));
      });
    } else if (p.allergens) {
      allergens.push(...p.allergens.split(',').map((s: string) => s.trim()));
    }

    const ingredient: StandardIngredient = {
      ingredientText,
      allergens: Array.from(new Set(allergens.filter(Boolean)))
    };

    // 4. Category deduction
    const category = this.determineCategory(p.categories_tags, p.product_name, p.categories);

    // 5. Code & external URL
    const code = p.code || p.id || p._id || `ext-${Date.now()}`;
    const externalUrl = p.code ? `https://world.openfoodfacts.org/product/${p.code}` : undefined;

    // 6. Dates and TTL (7 days)
    const now = new Date();
    const retrievedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // 7. Verification evidence notice (FSSAI separation principle: Open Food Facts is an external public registry, NOT government verification)
    const verification: StandardVerification = {
      authority: 'Open Food Facts (Public Registry)',
      identifier: code,
      status: 'Verification Unavailable',
      evidenceType: 'BARCODE_GTIN_RECORD',
      sourceUrl: externalUrl,
      details: 'Product details imported dynamically from Open Food Facts public registry.'
    };

    const productName = p.product_name || p.product_name_en || p.generic_name || 'Packaged Commodity';
    const brand = p.brands || p.brand_owner || 'Brand Unknown';

    return {
      id: `off-${code}`,
      name: productName,
      brand,
      category,
      manufacturer: p.manufacturing_places || p.brand_owner || undefined,
      barcodeGtIN: code,
      packSize: p.quantity || '100g',
      price: undefined,
      imageUrl:
        p.image_front_url ||
        p.image_url ||
        p.image_small_url ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      countryOfOrigin: p.countries || 'International',
      sourceType: 'EXTERNAL_CACHE',
      sourceName: provider,
      externalProductId: code,
      externalUrl,
      retrievedAt,
      expiresAt,
      provenanceNote: 'Dynamic entry retrieved from Open Food Facts global commodity database.',
      nutrition,
      ingredient,
      verification,
      certifications: []
    };
  }

  private static parseNumber(val: any): number | undefined {
    if (val === undefined || val === null || val === '') return undefined;
    const num = parseFloat(val);
    return isNaN(num) ? undefined : Math.round(num * 10) / 10;
  }

  private static parseSodium(val: any, isSalt: boolean = false): number | undefined {
    if (val === undefined || val === null || val === '') return undefined;
    const num = parseFloat(val);
    if (isNaN(num)) return undefined;
    // If salt is given in grams, convert to mg sodium: 1g salt ≈ 400mg sodium
    if (isSalt) {
      return Math.round(num * 400);
    }
    // If sodium is given in grams (< 10g), convert to mg
    return num < 10 ? Math.round(num * 1000) : Math.round(num);
  }

  public static determineCategory(categoriesTags?: string[], name?: string, rawCats?: string): string {
    const text = `${categoriesTags?.join(' ') || ''} ${name || ''} ${rawCats || ''}`.toLowerCase();
    if (text.includes('chip') || text.includes('crisp') || text.includes('wafer') || text.includes('tortilla') || text.includes('snack') || text.includes('namkeen')) {
      return 'Chips';
    }
    if (text.includes('biscuit') || text.includes('cookie') || text.includes('cracker') || text.includes('wafer')) {
      return 'Biscuits';
    }
    if (text.includes('peanut butter') || text.includes('butter') || text.includes('spread')) {
      return 'Peanut Butter';
    }
    if (text.includes('cereal') || text.includes('oat') || text.includes('muesli') || text.includes('flake') || text.includes('granola')) {
      return 'Cereal';
    }
    if (text.includes('milk') || text.includes('dairy') || text.includes('almond milk') || text.includes('soya milk') || text.includes('beverage')) {
      return 'Milk';
    }
    if (text.includes('juice') || text.includes('nectar') || text.includes('drink')) {
      return 'Juice';
    }
    if (text.includes('noodle') || text.includes('pasta') || text.includes('ramen') || text.includes('spaghetti')) {
      return 'Instant Noodles';
    }
    if (text.includes('protein') || text.includes('whey') || text.includes('supplement') || text.includes('bar')) {
      return 'Protein Products';
    }
    return 'Snacks';
  }
}
