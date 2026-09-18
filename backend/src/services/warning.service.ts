import { StandardProduct, WarningItem } from '../types';

export class WarningService {
  /**
   * Generates evidence-based warnings for health, compliance, and allergens
   */
  public static generateWarnings(product: StandardProduct): WarningItem[] {
    const warnings: WarningItem[] = [];
    const nutrition = product.nutrition;
    const ingredient = product.ingredient;

    // 1. Sodium warning
    if (nutrition?.sodium !== undefined) {
      if (nutrition.sodium >= 800) {
        warnings.push({
          id: 'warn-sodium-critical',
          field: 'sodium',
          severity: 'CRITICAL',
          title: 'Very High Sodium',
          message: 'Exceeds 800mg sodium per 100g. May represent over 40% of the recommended daily intake.',
          evidence: `${nutrition.sodium}mg sodium recorded per 100g.`
        });
      } else if (nutrition.sodium >= 600) {
        warnings.push({
          id: 'warn-sodium-high',
          field: 'sodium',
          severity: 'HIGH',
          title: 'High Sodium',
          message: 'Sodium is elevated. Frequent intake should be monitored.',
          evidence: `${nutrition.sodium}mg sodium recorded per 100g.`
        });
      }
    }

    // 2. Added Sugar / Total Sugar warning
    if (nutrition?.addedSugar !== undefined && nutrition.addedSugar >= 10) {
      warnings.push({
        id: 'warn-added-sugar-high',
        field: 'addedSugar',
        severity: 'HIGH',
        title: 'High Added Sugar',
        message: 'Contains substantial added sugar. WHO recommends limiting free sugars to < 25g daily.',
        evidence: `${nutrition.addedSugar}g added sugar per 100g.`
      });
    } else if (nutrition?.sugar !== undefined && nutrition.sugar >= 15) {
      warnings.push({
        id: 'warn-sugar-high',
        field: 'sugar',
        severity: 'HIGH',
        title: 'High Total Sugar',
        message: 'Total sugar exceeds 15g per 100g, contributing significantly to simple carbohydrate intake.',
        evidence: `${nutrition.sugar}g total sugar per 100g.`
      });
    }

    // 3. Saturated Fat warning
    if (nutrition?.saturatedFat !== undefined && nutrition.saturatedFat >= 8) {
      warnings.push({
        id: 'warn-sat-fat-high',
        field: 'saturatedFat',
        severity: 'HIGH',
        title: 'High Saturated Fat',
        message: 'Elevated saturated fatty acids. Health guidelines suggest moderating palm and saturated fats.',
        evidence: `${nutrition.saturatedFat}g saturated fat per 100g.`
      });
    } else if (nutrition?.saturatedFat !== undefined && nutrition.saturatedFat >= 5) {
      warnings.push({
        id: 'warn-sat-fat-mod',
        field: 'saturatedFat',
        severity: 'MEDIUM',
        title: 'Moderate Saturated Fat',
        message: 'Contains noticeable saturated fat (> 5g per 100g).',
        evidence: `${nutrition.saturatedFat}g saturated fat per 100g.`
      });
    }

    // 4. Trans Fat warning
    if (nutrition?.transFat !== undefined && nutrition.transFat >= 0.2) {
      warnings.push({
        id: 'warn-trans-fat',
        field: 'transFat',
        severity: 'CRITICAL',
        title: 'Trans Fat Detected',
        message: 'Industrial trans fat detected. FSSAI regulation mandates keeping trans fat below 0.2g / zero.',
        evidence: `${nutrition.transFat}g trans fat declared per 100g.`
      });
    }

    // 5. Allergens
    if (ingredient?.allergens && ingredient.allergens.length > 0) {
      warnings.push({
        id: 'warn-allergens',
        field: 'allergens',
        severity: 'MEDIUM',
        title: 'Allergen Advisory',
        message: `Contains potential allergens: ${ingredient.allergens.join(', ')}.`,
        evidence: `Extracted from declared allergen label: ${ingredient.allergens.join(', ')}.`
      });
    }

    // 6. Verification Status Warning
    if (!product.verification || product.verification.status === 'Verification Unavailable') {
      warnings.push({
        id: 'warn-verification-unavailable',
        field: 'verification',
        severity: 'LOW',
        title: 'Official Evidence Unavailable',
        message: 'No official regulatory verification record was located for this specific retail entry.',
        evidence: product.verification?.details || 'Absence of verifiable FSSAI license record in current lookup.'
      });
    } else if (product.verification.status === 'Needs Review') {
      warnings.push({
        id: 'warn-verification-review',
        field: 'verification',
        severity: 'MEDIUM',
        title: 'Licensing Status Needs Review',
        message: 'Official records indicate an audit or license update is currently pending.',
        evidence: product.verification.details || 'FSSAI FoSCoS registry flagged for update.'
      });
    } else if (product.verification.status === 'Mismatch') {
      warnings.push({
        id: 'warn-verification-mismatch',
        field: 'verification',
        severity: 'HIGH',
        title: 'Identifier Mismatch',
        message: 'Packaging declarations do not align with central authority registration records.',
        evidence: product.verification.details || 'Brand or manufacturer mismatch on central portal.'
      });
    }

    // 7. Missing Nutrition
    if (!nutrition || nutrition.calories === undefined) {
      warnings.push({
        id: 'warn-missing-nutrition',
        field: 'nutrition',
        severity: 'MEDIUM',
        title: 'Incomplete Nutrition Table',
        message: 'Caloric or macronutrient breakdown is partially missing from the package record.',
        evidence: 'Mandatory FSSAI nutritional declarations are incomplete.'
      });
    }

    return warnings;
  }
}
