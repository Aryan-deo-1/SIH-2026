import { describe, it, expect } from 'vitest';
import { WarningService } from '../src/services/warning.service';
import { StandardProduct } from '../src/types';

describe('WarningService', () => {
  it('should flag high sodium, trans fat, and allergens', () => {
    const product: StandardProduct = {
      id: 'test-1',
      name: 'Test Salty Snack',
      brand: 'TestBrand',
      category: 'Chips',
      sourceType: 'INTERNAL',
      nutrition: {
        sodium: 900,
        transFat: 0.3,
        saturatedFat: 9.0
      },
      ingredient: {
        ingredientText: 'Potato, palm oil, salt',
        allergens: ['Peanuts', 'Soy']
      }
    };

    const warnings = WarningService.generateWarnings(product);
    expect(warnings.some((w) => w.field === 'sodium' && w.severity === 'CRITICAL')).toBe(true);
    expect(warnings.some((w) => w.field === 'transFat' && w.severity === 'CRITICAL')).toBe(true);
    expect(warnings.some((w) => w.field === 'allergens')).toBe(true);
  });

  it('should flag verification unavailable when official evidence is missing', () => {
    const unverifiedProduct: StandardProduct = {
      id: 'test-2',
      name: 'Unverified Drink',
      brand: 'BrandX',
      category: 'Juice',
      sourceType: 'INTERNAL',
      verification: {
        authority: 'FSSAI',
        identifier: 'NOT_FOUND',
        status: 'Verification Unavailable',
        evidenceType: 'NONE'
      }
    };

    const warnings = WarningService.generateWarnings(unverifiedProduct);
    expect(warnings.some((w) => w.field === 'verification')).toBe(true);
  });
});
