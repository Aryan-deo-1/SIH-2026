import { StandardNutrition, QualityScoreResult, QualityScoreFactor } from '../types';
import { dbService } from './db.service';

export class ScoringService {
  /**
   * Calculates a transparent, deterministic quality score from 0.0 to 5.0
   * based on nutritional factors, FSSAI / ICMR rules, and clamping.
   */
  public static async calculateQualityScore(nutrition?: StandardNutrition): Promise<QualityScoreResult> {
    const factors: QualityScoreFactor[] = [];
    const baseScore = 5.0;
    let currentScore = baseScore;

    if (!nutrition || Object.keys(nutrition).length === 0) {
      return {
        score: 2.5,
        grade: 'C',
        baseScore,
        factors: [
          {
            factor: 'Missing Nutrition Information',
            delta: -2.5,
            reason: 'Nutritional declarations were not provided or legible on retail packaging.',
            type: 'PENALTY'
          }
        ],
        summary: 'Incomplete nutritional label information prevents accurate nutritional profiling.'
      };
    }

    // 1. Sugar & Added Sugar
    if (nutrition.addedSugar !== undefined && nutrition.addedSugar >= 10) {
      const penalty = -0.6;
      currentScore += penalty;
      factors.push({
        factor: 'High Added Sugar',
        delta: penalty,
        reason: `Contains ${nutrition.addedSugar}g added sugar per 100g (Threshold: 10g).`,
        type: 'PENALTY'
      });
    } else if (nutrition.sugar !== undefined && nutrition.sugar >= 15) {
      const penalty = -0.7;
      currentScore += penalty;
      factors.push({
        factor: 'High Total Sugar',
        delta: penalty,
        reason: `Contains ${nutrition.sugar}g total sugar per 100g (Threshold: 15g).`,
        type: 'PENALTY'
      });
    } else if (nutrition.sugar !== undefined && nutrition.sugar <= 5) {
      const bonus = 0.3;
      currentScore += bonus;
      factors.push({
        factor: 'Low Sugar Profile',
        delta: bonus,
        reason: `Naturally low in sugar (${nutrition.sugar}g per 100g).`,
        type: 'BONUS'
      });
    }

    // 2. Sodium
    if (nutrition.sodium !== undefined) {
      if (nutrition.sodium >= 800) {
        const penalty = -0.8;
        currentScore += penalty;
        factors.push({
          factor: 'Very High Sodium',
          delta: penalty,
          reason: `Contains ${nutrition.sodium}mg sodium per 100g (> 40% RDA).`,
          type: 'PENALTY'
        });
      } else if (nutrition.sodium >= 600) {
        const penalty = -0.6;
        currentScore += penalty;
        factors.push({
          factor: 'High Sodium',
          delta: penalty,
          reason: `Contains ${nutrition.sodium}mg sodium per 100g.`,
          type: 'PENALTY'
        });
      } else if (nutrition.sodium <= 100) {
        const bonus = 0.2;
        currentScore += bonus;
        factors.push({
          factor: 'Low Sodium',
          delta: bonus,
          reason: `Low sodium content (${nutrition.sodium}mg per 100g).`,
          type: 'BONUS'
        });
      }
    }

    // 3. Saturated Fat
    if (nutrition.saturatedFat !== undefined && nutrition.saturatedFat >= 5) {
      const penalty = -0.5;
      currentScore += penalty;
      factors.push({
        factor: 'High Saturated Fat',
        delta: penalty,
        reason: `Contains ${nutrition.saturatedFat}g saturated fat per 100g.`,
        type: 'PENALTY'
      });
    }

    // 4. Trans Fat
    if (nutrition.transFat !== undefined && nutrition.transFat >= 0.2) {
      const penalty = -1.0;
      currentScore += penalty;
      factors.push({
        factor: 'Industrial Trans Fat Present',
        delta: penalty,
        reason: `Contains ${nutrition.transFat}g trans fat per 100g. Trans fats should be avoided.`,
        type: 'PENALTY'
      });
    }

    // 5. Protein
    if (nutrition.protein !== undefined) {
      if (nutrition.protein >= 20) {
        const bonus = 0.5;
        currentScore += bonus;
        factors.push({
          factor: 'Very High Protein',
          delta: bonus,
          reason: `Exceptional protein density (${nutrition.protein}g per 100g).`,
          type: 'BONUS'
        });
      } else if (nutrition.protein >= 10) {
        const bonus = 0.3;
        currentScore += bonus;
        factors.push({
          factor: 'High Protein',
          delta: bonus,
          reason: `Good source of dietary protein (${nutrition.protein}g per 100g).`,
          type: 'BONUS'
        });
      }
    }

    // 6. Dietary Fiber
    if (nutrition.fiber !== undefined && nutrition.fiber >= 5) {
      const bonus = 0.3;
      currentScore += bonus;
      factors.push({
        factor: 'High Dietary Fiber',
        delta: bonus,
        reason: `High dietary fiber content (${nutrition.fiber}g per 100g).`,
        type: 'BONUS'
      });
    }

    // Clamp score between 0.0 and 5.0
    const finalScore = Math.max(0, Math.min(5.0, Math.round(currentScore * 10) / 10));

    // Grade assignment
    let grade: 'A' | 'B' | 'C' | 'D' | 'E' = 'C';
    if (finalScore >= 4.2) grade = 'A';
    else if (finalScore >= 3.5) grade = 'B';
    else if (finalScore >= 2.5) grade = 'C';
    else if (finalScore >= 1.5) grade = 'D';
    else grade = 'E';

    const penaltyCount = factors.filter((f) => f.type === 'PENALTY').length;
    const bonusCount = factors.filter((f) => f.type === 'BONUS').length;
    const summary =
      finalScore >= 4.0
        ? `Clean nutritional profile with ${bonusCount} positive health markers.`
        : finalScore >= 2.5
        ? `Moderate compliance score. Noted ${penaltyCount} dietary concerns to consider.`
        : `Low score due to ${penaltyCount} elevated critical nutrients (sugar, sodium, or saturated fats).`;

    return {
      score: finalScore,
      grade,
      baseScore,
      factors,
      summary
    };
  }
}
