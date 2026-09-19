export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active';
export type NutritionGoal = 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_building' | 'high_protein' | 'general_health';
export type DietTypePreference = 'vegetarian' | 'non-vegetarian' | 'eggetarian' | 'vegan';

export interface UserNutritionProfile {
  age?: number;
  sex?: 'male' | 'female';
  weightKg?: number;
  heightCm?: number;
  activityLevel?: ActivityLevel;
  goal?: NutritionGoal;
  dietPreference?: DietTypePreference;
  allergies?: string[];
  budget?: string;
}

export interface MacroTarget {
  grams: number;
  calories: number;
  percentage: number;
}

export interface NutritionCalculationResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  deficitOrSurplus: number;
  goalLabel: string;
  protein: MacroTarget;
  carbs: MacroTarget;
  fat: MacroTarget;
  mealSplits: {
    breakfast: { calories: number; proteinGrams: number };
    midMorningSnack: { calories: number; proteinGrams: number };
    lunch: { calories: number; proteinGrams: number };
    eveningSnack: { calories: number; proteinGrams: number };
    dinner: { calories: number; proteinGrams: number };
  };
  missingFields: string[];
}

export class NutritionCalculatorService {
  private static ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    extra_active: 1.9
  };

  /**
   * Deterministically calculates BMR, TDEE, and macro breakdown based on standard clinical formulas
   */
  public static calculate(profile: UserNutritionProfile): NutritionCalculationResult {
    const missing: string[] = [];
    if (!profile.age) missing.push('age');
    if (!profile.sex) missing.push('sex (male/female)');
    if (!profile.weightKg) missing.push('weight');
    if (!profile.heightCm) missing.push('height');
    if (!profile.activityLevel) missing.push('activity level (sedentary, light, moderate, active)');
    if (!profile.goal) missing.push('fitness/nutrition goal (weight loss, muscle gain, maintenance)');

    const age = profile.age || 28;
    const sex = profile.sex || 'male';
    const weight = profile.weightKg || 68;
    const height = profile.heightCm || 172;
    const activity = profile.activityLevel || 'moderate';
    const goal = profile.goal || 'general_health';

    // 1. Mifflin-St Jeor Equation for BMR
    let bmr: number;
    if (sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    bmr = Math.round(bmr);

    // 2. TDEE
    const multiplier = this.ACTIVITY_MULTIPLIERS[activity] || 1.55;
    const tdee = Math.round(bmr * multiplier);

    // 3. Calorie Target Adjustment
    let targetCalories: number;
    let deficitOrSurplus = 0;
    let goalLabel = 'Maintenance & General Wellness';

    switch (goal) {
      case 'weight_loss':
        deficitOrSurplus = -450;
        targetCalories = Math.max(sex === 'female' ? 1200 : 1500, tdee - 450);
        goalLabel = 'Caloric Deficit for Sustainable Fat Loss';
        break;
      case 'weight_gain':
        deficitOrSurplus = 400;
        targetCalories = tdee + 400;
        goalLabel = 'Caloric Surplus for Healthy Weight Gain';
        break;
      case 'muscle_building':
      case 'high_protein':
        deficitOrSurplus = 300;
        targetCalories = tdee + 300;
        goalLabel = 'Hypertrophy & High-Protein Fuel';
        break;
      case 'maintenance':
      case 'general_health':
      default:
        deficitOrSurplus = 0;
        targetCalories = tdee;
        goalLabel = 'Energy Balance & Metabolic Maintenance';
        break;
    }

    targetCalories = Math.round(targetCalories);

    // 4. Deterministic Macronutrient Breakdown
    // Protein Target:
    let proteinPerKg: number;
    if (goal === 'muscle_building' || goal === 'high_protein') {
      proteinPerKg = 2.0;
    } else if (goal === 'weight_loss') {
      proteinPerKg = 1.8; // Preserves lean muscle mass during deficit
    } else {
      proteinPerKg = 1.2;
    }

    const proteinGrams = Math.round(weight * proteinPerKg);
    const proteinCalories = proteinGrams * 4;

    // Fat Target: ~25% of total caloric intake (healthy fats, hormones)
    const fatCalories = Math.round(targetCalories * 0.25);
    const fatGrams = Math.round(fatCalories / 9);

    // Carbohydrate Target: Remaining calories
    const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
    const carbGrams = Math.round(carbCalories / 4);

    const proteinPercent = Math.round((proteinCalories / targetCalories) * 100);
    const fatPercent = Math.round((fatCalories / targetCalories) * 100);
    const carbPercent = Math.max(0, 100 - (proteinPercent + fatPercent));

    // 5. Meal Partitioning
    const mealSplits = {
      breakfast: {
        calories: Math.round(targetCalories * 0.25),
        proteinGrams: Math.round(proteinGrams * 0.25)
      },
      midMorningSnack: {
        calories: Math.round(targetCalories * 0.10),
        proteinGrams: Math.round(proteinGrams * 0.10)
      },
      lunch: {
        calories: Math.round(targetCalories * 0.35),
        proteinGrams: Math.round(proteinGrams * 0.35)
      },
      eveningSnack: {
        calories: Math.round(targetCalories * 0.10),
        proteinGrams: Math.round(proteinGrams * 0.10)
      },
      dinner: {
        calories: Math.round(targetCalories * 0.20),
        proteinGrams: Math.round(proteinGrams * 0.20)
      }
    };

    return {
      bmr,
      tdee,
      targetCalories,
      deficitOrSurplus,
      goalLabel,
      protein: { grams: proteinGrams, calories: proteinCalories, percentage: proteinPercent },
      carbs: { grams: carbGrams, calories: carbCalories, percentage: carbPercent },
      fat: { grams: fatGrams, calories: fatCalories, percentage: fatPercent },
      mealSplits,
      missingFields: missing
    };
  }

  /**
   * Intelligently parses user text and conversation history to extract profile parameters
   */
  public static extractProfileFromText(text: string, existingProfile?: UserNutritionProfile): UserNutritionProfile {
    const profile: UserNutritionProfile = { ...(existingProfile || {}) };
    const lower = text.toLowerCase();

    // 1. Weight extraction (e.g., 68kg, 68 kg, 75 kgs, weight is 80)
    const weightMatch = lower.match(/(?:weight\s*(?:is|:)?\s*)?(\d{2,3}(?:\.\d+)?)\s*(?:kg|kgs|kilo|kilograms)/i) ||
                        lower.match(/(\d{2,3}(?:\.\d+)?)\s*kg/i);
    if (weightMatch) {
      profile.weightKg = parseFloat(weightMatch[1]);
    }

    // 2. Height extraction
    // Feet + inches (e.g. 5'9, 5'9", 5ft 9in, 5 feet 9 inches, 5.9 ft)
    const ftInMatch = lower.match(/(\d)\s*(?:'|ft|feet)\s*(\d{1,2})?\s*(?:"|in|inches)?/i);
    if (ftInMatch) {
      const feet = parseInt(ftInMatch[1], 10);
      const inches = ftInMatch[2] ? parseInt(ftInMatch[2], 10) : 0;
      profile.heightCm = Math.round((feet * 12 + inches) * 2.54);
    } else {
      // Direct centimeters (e.g. 175 cm, 175cm, height is 180)
      const cmMatch = lower.match(/(?:height\s*(?:is|:)?\s*)?(\d{2,3})\s*(?:cm|centimeters)/i);
      if (cmMatch) {
        profile.heightCm = parseInt(cmMatch[1], 10);
      }
    }

    // 3. Age extraction (e.g. 24 years old, age 25, 28 yrs, 28 y/o)
    const ageMatch = lower.match(/(?:age\s*(?:is|:)?\s*)?(\d{1,2})\s*(?:years|yrs|year|yo|y\/o)/i) ||
                     lower.match(/(?:age\s*(?:is|:)?\s*)(\d{1,2})\b/i);
    if (ageMatch) {
      profile.age = parseInt(ageMatch[1], 10);
    }

    // 4. Sex / Gender
    if (/\b(male|man|guy|ladka|purush)\b/i.test(lower) && !/\bfemale\b/i.test(lower)) {
      profile.sex = 'male';
    } else if (/\b(female|woman|girl|ladki|mahila)\b/i.test(lower)) {
      profile.sex = 'female';
    }

    // 5. Goal extraction
    if (/\b(lose weight|fat loss|cut|cutting|vajan ghatana|weight loss)\b/i.test(lower)) {
      profile.goal = 'weight_loss';
    } else if (/\b(gain weight|bulk|bulking|weight gain|vajan badhana)\b/i.test(lower)) {
      profile.goal = 'weight_gain';
    } else if (/\b(muscle building|hypertrophy|gain muscle|build muscle|bodybuilding)\b/i.test(lower)) {
      profile.goal = 'muscle_building';
    } else if (/\b(high protein|more protein|protein diet)\b/i.test(lower)) {
      profile.goal = 'high_protein';
    } else if (/\b(maintain|maintenance|fit rahna|healthy eating)\b/i.test(lower)) {
      profile.goal = 'maintenance';
    }

    // 6. Activity Level
    if (/\b(sedentary|desk job|no exercise|sitting all day)\b/i.test(lower)) {
      profile.activityLevel = 'sedentary';
    } else if (/\b(lightly active|light exercise|walking|1-2 days)\b/i.test(lower)) {
      profile.activityLevel = 'light';
    } else if (/\b(moderate|moderately active|3-4 days|gym regular)\b/i.test(lower)) {
      profile.activityLevel = 'moderate';
    } else if (/\b(very active|heavy gym|5-6 days|athlete|intense)\b/i.test(lower)) {
      profile.activityLevel = 'active';
    }

    // 7. Dietary Preference
    if (/\b(pure veg|vegetarian|shakahari|veg)\b/i.test(lower) && !/\bnon-veg\b/i.test(lower)) {
      profile.dietPreference = 'vegetarian';
    } else if (/\b(non-veg|nonveg|non vegetarian|mansahari|chicken|mutton)\b/i.test(lower)) {
      profile.dietPreference = 'non-vegetarian';
    } else if (/\b(eggetarian|egg vegetarian|ande khata hu)\b/i.test(lower)) {
      profile.dietPreference = 'eggetarian';
    } else if (/\b(vegan)\b/i.test(lower)) {
      profile.dietPreference = 'vegan';
    }

    return profile;
  }
}
