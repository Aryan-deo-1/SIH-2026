import { StandardProduct, PositiveItem } from '../types';

export class PositivesService {
  /**
   * Generates strictly data-backed positive nutritional highlights
   */
  public static generatePositives(product: StandardProduct): PositiveItem[] {
    const positives: PositiveItem[] = [];
    const nutrition = product.nutrition;

    if (!nutrition) return positives;

    // 1. Protein
    if (nutrition.protein !== undefined) {
      if (nutrition.protein >= 20) {
        positives.push({
          id: 'pos-protein-elite',
          field: 'protein',
          title: 'Exceptional Protein Content',
          message: 'Dense protein source supporting muscle recovery, satiety, and active lifestyle.',
          evidence: `${nutrition.protein}g protein per 100g.`
        });
      } else if (nutrition.protein >= 10) {
        positives.push({
          id: 'pos-protein-high',
          field: 'protein',
          title: 'Good Source of Protein',
          message: 'Meets FSSAI threshold for high protein food classification.',
          evidence: `${nutrition.protein}g protein per 100g.`
        });
      }
    }

    // 2. Fiber
    if (nutrition.fiber !== undefined && nutrition.fiber >= 5) {
      positives.push({
        id: 'pos-fiber-high',
        field: 'fiber',
        title: 'High Dietary Fiber',
        message: 'Aids digestive health, promotes healthy gut microbiota, and smooth blood sugar curves.',
        evidence: `${nutrition.fiber}g dietary fiber per 100g.`
      });
    }

    // 3. Sugar
    if (nutrition.addedSugar === 0) {
      positives.push({
        id: 'pos-zero-added-sugar',
        field: 'addedSugar',
        title: 'Zero Added Sugar',
        message: 'Contains no added cane sugar, high fructose corn syrup, or refined syrups.',
        evidence: '0g added sugar declared.'
      });
    } else if (nutrition.sugar !== undefined && nutrition.sugar <= 5) {
      positives.push({
        id: 'pos-sugar-low',
        field: 'sugar',
        title: 'Naturally Low in Sugar',
        message: 'Total sugar content is within the FSSAI low-sugar bracket (≤ 5g per 100g).',
        evidence: `${nutrition.sugar}g total sugar per 100g.`
      });
    }

    // 4. Sodium
    if (nutrition.sodium !== undefined && nutrition.sodium <= 120) {
      positives.push({
        id: 'pos-sodium-low',
        field: 'sodium',
        title: 'Low Sodium Formulation',
        message: 'Heart-healthy sodium level well under typical processed snack benchmarks.',
        evidence: `${nutrition.sodium}mg sodium per 100g.`
      });
    }

    // 5. Trans Fat Free
    if (nutrition.transFat === 0 || (nutrition.transFat !== undefined && nutrition.transFat < 0.1)) {
      positives.push({
        id: 'pos-trans-fat-free',
        field: 'transFat',
        title: 'Zero Trans Fat',
        message: 'Compliant with FSSAI mandate eliminating industrial trans fats.',
        evidence: '0.0g trans fat per 100g.'
      });
    }

    // 6. Micronutrients
    if (nutrition.calcium !== undefined && nutrition.calcium >= 100) {
      positives.push({
        id: 'pos-calcium',
        field: 'calcium',
        title: 'Good Source of Calcium',
        message: 'Provides meaningful dietary calcium essential for bone mineral density.',
        evidence: `${nutrition.calcium}mg calcium per 100g.`
      });
    }

    if (nutrition.iron !== undefined && nutrition.iron >= 3) {
      positives.push({
        id: 'pos-iron',
        field: 'iron',
        title: 'Contains Iron',
        message: 'Contributes to daily iron requirements for red blood cell health.',
        evidence: `${nutrition.iron}mg iron per 100g.`
      });
    }

    // 7. Official Verification Positive
    if (product.verification?.status === 'Verified') {
      positives.push({
        id: 'pos-fssai-verified',
        field: 'verification',
        title: 'FSSAI License Verified',
        message: '14-digit manufacturing license verified on the official FoSCoS portal.',
        evidence: `License #${product.verification.identifier} is active.`
      });
    }

    return positives;
  }
}
