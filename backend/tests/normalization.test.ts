import { describe, it, expect } from 'vitest';
import { NormalizationService } from '../src/services/normalization.service';

describe('NormalizationService', () => {
  it('should normalize OpenFoodFacts nutriments correctly', () => {
    const rawExternal = {
      code: '8901491101837',
      product_name: 'Classic Salted Chips',
      brands: 'Lays',
      categories: 'Snacks, Chips',
      nutriments: {
        'energy-kcal_100g': 544,
        proteins_100g: 7.0,
        carbohydrates_100g: 53.0,
        sugars_100g: 1.0,
        fat_100g: 34.0,
        'saturated-fat_100g': 14.5,
        sodium_100g: 0.59 // in grams -> 590mg
      },
      ingredients_text: 'Potato, edible vegetable oil, salt.',
      allergens_tags: ['en:gluten']
    };

    const normalized = NormalizationService.normalizeExternalProduct(rawExternal);

    expect(normalized.barcodeGtIN).toBe('8901491101837');
    expect(normalized.name).toBe('Classic Salted Chips');
    expect(normalized.brand).toBe('Lays');
    expect(normalized.category).toBe('Chips');
    expect(normalized.nutrition?.protein).toBe(7.0);
    expect(normalized.nutrition?.calories).toBe(544);
    expect(normalized.nutrition?.sodium).toBe(590);
    expect(normalized.ingredient?.allergens).toContain('gluten');
    expect(normalized.verification?.status).toBe('Verification Unavailable');
  });
});
