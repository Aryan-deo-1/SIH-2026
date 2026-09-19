import { describe, it, expect } from 'vitest';
import { NutritionCalculatorService, UserNutritionProfile } from '../src/services/nutritionCalculator.service';

describe('NutritionCalculatorService', () => {
  it('should calculate BMR and TDEE correctly for standard male profile', () => {
    const profile: UserNutritionProfile = {
      age: 25,
      sex: 'male',
      weightKg: 70,
      heightCm: 175,
      activityLevel: 'moderate',
      goal: 'muscle_building'
    };

    const result = NutritionCalculatorService.calculate(profile);

    // Mifflin-St Jeor for Male: 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1674
    expect(result.bmr).toBe(1674);
    // TDEE: 1674 * 1.55 = 2594.7 -> 2595
    expect(result.tdee).toBe(2595);
    // Muscle building: TDEE + 300 = 2895
    expect(result.targetCalories).toBe(2895);
    // Protein: 70 * 2.0 = 140g
    expect(result.protein.grams).toBe(140);
    // Missing fields should be empty
    expect(result.missingFields).toHaveLength(0);
  });

  it('should calculate BMR and TDEE correctly for female weight-loss profile', () => {
    const profile: UserNutritionProfile = {
      age: 30,
      sex: 'female',
      weightKg: 65,
      heightCm: 162,
      activityLevel: 'light',
      goal: 'weight_loss'
    };

    const result = NutritionCalculatorService.calculate(profile);

    // Mifflin-St Jeor for Female: 10*65 + 6.25*162 - 5*30 - 161 = 650 + 1012.5 - 150 - 161 = 1351.5 -> 1352
    expect(result.bmr).toBe(1352);
    // TDEE: 1352 * 1.375 = 1859
    expect(result.tdee).toBe(1859);
    // Weight loss deficit: 1859 - 450 = 1409
    expect(result.targetCalories).toBe(1409);
    // Protein: 65 * 1.8 = 117g
    expect(result.protein.grams).toBe(117);
    // Meal partition sum should match total target calories within rounding
    const mealSum =
      result.mealSplits.breakfast.calories +
      result.mealSplits.midMorningSnack.calories +
      result.mealSplits.lunch.calories +
      result.mealSplits.eveningSnack.calories +
      result.mealSplits.dinner.calories;
    expect(Math.abs(mealSum - result.targetCalories)).toBeLessThanOrEqual(5);
  });

  it('should accurately extract stats from free-form user message', () => {
    const userText = "Hey, my weight is 68 kg and height is 5'9. I am 24 years old male with desk job. I want to build muscle and I am pure veg.";
    const profile = NutritionCalculatorService.extractProfileFromText(userText);

    expect(profile.weightKg).toBe(68);
    // 5'9 is 69 inches * 2.54 = 175.26 -> 175 cm
    expect(profile.heightCm).toBe(175);
    expect(profile.age).toBe(24);
    expect(profile.sex).toBe('male');
    expect(profile.goal).toBe('muscle_building');
    expect(profile.dietPreference).toBe('vegetarian');
  });

  it('should identify missing fields when profile is incomplete', () => {
    const partialProfile: UserNutritionProfile = {
      weightKg: 80
    };

    const result = NutritionCalculatorService.calculate(partialProfile);
    expect(result.missingFields).toContain('age');
    expect(result.missingFields).toContain('height');
    expect(result.missingFields.length).toBeGreaterThan(2);
  });
});
