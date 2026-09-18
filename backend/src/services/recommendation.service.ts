import { StandardProduct, RecommendationItem, RecommendationMetricComparison } from '../types';
import { dbService } from './db.service';
import { externalProductService } from './external-product.service';
import { ProductService } from './product.service';

export interface RecommendationWeights {
  nutritionWeight: number; // default 0.40
  preferenceWeight: number; // default 0.20
  priceWeight: number; // default 0.15
  categoryWeight: number; // default 0.15
  verificationWeight: number; // default 0.10
}

export const DEFAULT_WEIGHTS: RecommendationWeights = {
  nutritionWeight: 0.40,
  preferenceWeight: 0.20,
  priceWeight: 0.15,
  categoryWeight: 0.15,
  verificationWeight: 0.10
};

export class RecommendationService {
  /**
   * Discovers and ranks better alternative products for a given source product
   * Dynamically pools internal database items + Open Food Facts category alternatives
   */
  public static async getRecommendations(
    sourceProduct: StandardProduct,
    userPreferences?: any,
    weights: RecommendationWeights = DEFAULT_WEIGHTS
  ): Promise<RecommendationItem[]> {
    const rawDbProducts: any[] = await dbService.getAllProducts();
    const candidateMap = new Map<string, any>();

    // Add DB candidates (excluding source product)
    for (const raw of rawDbProducts) {
      const p = ProductService.formatProductRecord(raw);
      const isSame = p.id === sourceProduct.id || (p.barcodeGtIN && p.barcodeGtIN === sourceProduct.barcodeGtIN);
      if (!isSame) {
        candidateMap.set(p.barcodeGtIN || p.id, p);
      }
    }

    // Dynamically query Open Food Facts for similar category products
    try {
      const externalSimilar = await externalProductService.searchSimilar(sourceProduct);
      for (const ext of externalSimilar) {
        const key = ext.barcodeGtIN || ext.id;
        const isSame = key === sourceProduct.barcodeGtIN || key === sourceProduct.id;
        if (!isSame && !candidateMap.has(key)) {
          candidateMap.set(key, ext);
        }
      }
    } catch (err) {
      console.warn('[RecommendationService] Non-fatal error pulling external similar products:', err);
    }

    const candidates = Array.from(candidateMap.values());

    const scoredRecommendations: RecommendationItem[] = [];

    for (const candidate of candidates) {
      const {
        totalScore,
        nutritionScore,
        preferenceScore,
        priceScore,
        categoryScore,
        verificationScore,
        reasons,
        comparisons
      } = this.evaluateCandidate(sourceProduct, candidate, userPreferences, weights);

      // Only recommend products that have positive reasons or higher/comparable nutritional score
      if (reasons.length > 0 && totalScore >= 45) {
        scoredRecommendations.push({
          candidateProduct: candidate,
          totalScore: Math.round(totalScore),
          nutritionScore: Math.round(nutritionScore),
          preferenceScore: Math.round(preferenceScore),
          priceScore: Math.round(priceScore),
          categoryScore: Math.round(categoryScore),
          verificationScore: Math.round(verificationScore),
          reason: reasons.join(' • '),
          comparisons
        });
      }
    }

    // Sort by highest totalScore descending
    scoredRecommendations.sort((a, b) => b.totalScore - a.totalScore);

    return scoredRecommendations.slice(0, 4);
  }

  private static evaluateCandidate(
    source: StandardProduct,
    candidate: any,
    userPreferences?: any,
    weights: RecommendationWeights = DEFAULT_WEIGHTS
  ) {
    const comparisons: RecommendationMetricComparison[] = [];
    const reasons: string[] = [];

    const srcNut = source.nutrition || {};
    const candNut = candidate.nutrition || {};

    // 1. Category Similarity (0 to 100)
    let categoryScore = 50;
    if (source.category && candidate.category) {
      if (source.category.toLowerCase() === candidate.category.toLowerCase()) {
        categoryScore = 100;
      } else {
        categoryScore = 40; // adjacent food group
      }
    }

    // 2. Nutrition Fit (0 to 100)
    let nutritionScore = 60;
    let betterCount = 0;

    // Sugar comparison
    if (srcNut.sugar !== undefined && candNut.sugar !== undefined) {
      const sugarDelta = srcNut.sugar - candNut.sugar;
      const isBetter = sugarDelta > 1;
      const pct = srcNut.sugar > 0 ? Math.round((sugarDelta / srcNut.sugar) * 100) : 0;

      if (isBetter && pct >= 15) {
        nutritionScore += 12;
        betterCount++;
        reasons.push(`${pct}% lower sugar`);
        comparisons.push({
          metric: 'Sugar',
          sourceValue: `${srcNut.sugar}g`,
          candidateValue: `${candNut.sugar}g`,
          improvementText: `-${pct}% less sugar`,
          isBetter: true
        });
      } else if (sugarDelta < -5) {
        nutritionScore -= 10;
        comparisons.push({
          metric: 'Sugar',
          sourceValue: `${srcNut.sugar}g`,
          candidateValue: `${candNut.sugar}g`,
          improvementText: `+${Math.abs(sugarDelta)}g higher`,
          isBetter: false
        });
      }
    }

    // Sodium comparison
    if (srcNut.sodium !== undefined && candNut.sodium !== undefined) {
      const sodiumDelta = srcNut.sodium - candNut.sodium;
      const isBetter = sodiumDelta > 100;
      const pct = srcNut.sodium > 0 ? Math.round((sodiumDelta / srcNut.sodium) * 100) : 0;

      if (isBetter && pct >= 20) {
        nutritionScore += 12;
        betterCount++;
        reasons.push(`${pct}% lower sodium`);
        comparisons.push({
          metric: 'Sodium',
          sourceValue: `${srcNut.sodium}mg`,
          candidateValue: `${candNut.sodium}mg`,
          improvementText: `-${pct}% less sodium`,
          isBetter: true
        });
      } else if (sodiumDelta < -200) {
        nutritionScore -= 10;
      }
    }

    // Protein comparison
    if (srcNut.protein !== undefined && candNut.protein !== undefined) {
      const proteinDelta = candNut.protein - srcNut.protein;
      const isBetter = proteinDelta >= 2;

      if (isBetter) {
        nutritionScore += 10;
        betterCount++;
        reasons.push(`+${proteinDelta.toFixed(1)}g higher protein`);
        comparisons.push({
          metric: 'Protein',
          sourceValue: `${srcNut.protein}g`,
          candidateValue: `${candNut.protein}g`,
          improvementText: `+${proteinDelta.toFixed(1)}g protein`,
          isBetter: true
        });
      }
    }

    // Saturated Fat comparison
    if (srcNut.saturatedFat !== undefined && candNut.saturatedFat !== undefined) {
      const satFatDelta = srcNut.saturatedFat - candNut.saturatedFat;
      if (satFatDelta >= 3) {
        nutritionScore += 8;
        betterCount++;
        reasons.push(`Lower saturated fat`);
        comparisons.push({
          metric: 'Saturated Fat',
          sourceValue: `${srcNut.saturatedFat}g`,
          candidateValue: `${candNut.saturatedFat}g`,
          improvementText: `-${satFatDelta.toFixed(1)}g less saturated fat`,
          isBetter: true
        });
      }
    }

    // Fiber comparison
    if (srcNut.fiber !== undefined && candNut.fiber !== undefined) {
      const fiberDelta = candNut.fiber - srcNut.fiber;
      if (fiberDelta >= 2) {
        nutritionScore += 8;
        betterCount++;
        reasons.push(`Higher dietary fiber`);
        comparisons.push({
          metric: 'Fiber',
          sourceValue: `${srcNut.fiber}g`,
          candidateValue: `${candNut.fiber}g`,
          improvementText: `+${fiberDelta.toFixed(1)}g fiber`,
          isBetter: true
        });
      }
    }

    // 3. User Preference Fit (0 to 100)
    let preferenceScore = 70;
    if (userPreferences) {
      if (userPreferences.dietType === 'Vegan' && candidate.ingredient) {
        const text = candidate.ingredient.ingredientText.toLowerCase();
        if (text.includes('milk') || text.includes('whey') || text.includes('egg')) {
          preferenceScore = 20;
        } else {
          preferenceScore = 95;
        }
      }
      if (userPreferences.avoidIngredients && candidate.ingredient) {
        const text = candidate.ingredient.ingredientText.toLowerCase();
        for (const avoid of userPreferences.avoidIngredients) {
          if (text.includes(avoid.toLowerCase())) {
            preferenceScore = 15;
            break;
          }
        }
      }
      if (userPreferences.minProtein && candNut.protein && candNut.protein >= userPreferences.minProtein) {
        preferenceScore += 10;
      }
      if (userPreferences.maxSugar && candNut.sugar && candNut.sugar <= userPreferences.maxSugar) {
        preferenceScore += 10;
      }
    }

    // 4. Price / Value Fit (0 to 100)
    let priceScore = 70;
    if (source.price && candidate.price) {
      if (candidate.price < source.price) {
        priceScore = 95;
        reasons.push(`Budget friendly (₹${candidate.price})`);
      } else if (candidate.price <= source.price * 1.2) {
        priceScore = 75;
      } else {
        priceScore = 55;
      }
    }

    // 5. Verification Score (0 to 100)
    let verificationScore = 60;
    const candEvidence = candidate.verificationEvidence && candidate.verificationEvidence[0];
    if (candEvidence && candEvidence.status === 'Verified') {
      verificationScore = 100;
    } else if (candEvidence && candEvidence.status === 'Needs Review') {
      verificationScore = 50;
    } else {
      verificationScore = 30;
    }

    // Clamp subscores
    nutritionScore = Math.min(100, Math.max(0, nutritionScore));
    preferenceScore = Math.min(100, Math.max(0, preferenceScore));
    priceScore = Math.min(100, Math.max(0, priceScore));
    categoryScore = Math.min(100, Math.max(0, categoryScore));
    verificationScore = Math.min(100, Math.max(0, verificationScore));

    // Weighted Formula
    const totalScore =
      nutritionScore * weights.nutritionWeight +
      preferenceScore * weights.preferenceWeight +
      priceScore * weights.priceWeight +
      categoryScore * weights.categoryWeight +
      verificationScore * weights.verificationWeight;

    if (reasons.length === 0 && betterCount === 0) {
      reasons.push('Similar category alternative with balanced macronutrient profile');
    }

    return {
      totalScore,
      nutritionScore,
      preferenceScore,
      priceScore,
      categoryScore,
      verificationScore,
      reasons,
      comparisons
    };
  }
}
