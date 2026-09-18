import { describe, it, expect } from 'vitest';
import { ScoringService } from '../src/services/scoring.service';

describe('ScoringService', () => {
  it('should compute high score for clean nutritional profile', async () => {
    const cleanNutrition = {
      servingSize: '100g',
      calories: 320,
      protein: 24, // +0.5
      carbohydrates: 20,
      sugar: 2, // +0.3
      addedSugar: 0,
      fat: 6,
      saturatedFat: 1.5,
      transFat: 0,
      fiber: 8, // +0.3
      sodium: 80 // +0.2
    };

    const result = await ScoringService.calculateQualityScore(cleanNutrition);
    expect(result.score).toBeGreaterThanOrEqual(4.5);
    expect(result.score).toBeLessThanOrEqual(5.0);
    expect(result.grade).toBe('A');
  });

  it('should penalize high added sugar and high sodium', async () => {
    const junkNutrition = {
      servingSize: '100g',
      calories: 540,
      protein: 4,
      carbohydrates: 65,
      sugar: 28,
      addedSugar: 24, // -0.6
      fat: 32,
      saturatedFat: 14, // -0.5
      transFat: 0.3, // -1.0
      fiber: 1,
      sodium: 950 // -0.8
    };

    const result = await ScoringService.calculateQualityScore(junkNutrition);
    expect(result.score).toBeLessThanOrEqual(2.5);
    expect(['C', 'D', 'E']).toContain(result.grade);
    expect(result.factors.some((f) => f.factor.includes('Sugar'))).toBe(true);
    expect(result.factors.some((f) => f.factor.includes('Sodium'))).toBe(true);
  });

  it('should clamp score strictly between 0.0 and 5.0', async () => {
    const catastrophicNutrition = {
      calories: 800,
      sugar: 60,
      addedSugar: 50,
      sodium: 3000,
      saturatedFat: 40,
      transFat: 5.0
    };

    const result = await ScoringService.calculateQualityScore(catastrophicNutrition);
    expect(result.score).toBeGreaterThanOrEqual(0.0);
    expect(result.score).toBeLessThanOrEqual(5.0);
  });

  it('should handle missing nutrition gracefully', async () => {
    const result = await ScoringService.calculateQualityScore(undefined);
    expect(result.score).toBe(2.5);
    expect(result.factors[0].factor).toContain('Missing');
  });
});
