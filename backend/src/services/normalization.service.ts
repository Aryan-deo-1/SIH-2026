import { StandardProduct, StandardNutrition, StandardIngredient, StandardVerification } from '../types';

export class NormalizationService {
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
