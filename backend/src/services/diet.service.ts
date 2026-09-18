import { dbService } from './db.service';
import { externalProductService } from './external-product.service';
import { DietFilterParams, StandardProduct } from '../types';
import { ScoringService } from './scoring.service';
import { ProductService } from './product.service';

export interface DietFinderResult {
  product: StandardProduct;
  matchScore: number; // 0 - 100%
  qualityScore: number;
  highlightReasons: string[];
}

export class DietService {
  /**
   * Filters and ranks products according to customized macronutrient goals and budgetary limits
   * Dynamically evaluates internal database + Open Food Facts category items
   */
  public static async findProductsByDiet(params: DietFilterParams): Promise<DietFinderResult[]> {
    const rawDbProducts = await dbService.getAllProducts();
    const productMap = new Map<string, StandardProduct>();

    // Add DB products
    for (const raw of rawDbProducts) {
      const prod = ProductService.formatProductRecord(raw);
      productMap.set(prod.barcodeGtIN || prod.id, prod);
    }

    // If a category is requested, dynamically pull candidates from Open Food Facts
    if (params.category && params.category !== 'ALL') {
      try {
        const externalCandidates = await externalProductService.searchByCategory(params.category);
        for (const ext of externalCandidates) {
          const key = ext.barcodeGtIN || ext.id;
          if (!productMap.has(key)) {
            productMap.set(key, ext);
          }
        }
      } catch (err) {
        console.warn('[DietService] Non-fatal error pulling external diet candidates:', err);
      }
    }

    const allProducts = Array.from(productMap.values());
    const results: DietFinderResult[] = [];

    for (const prod of allProducts) {
      const nut = prod.nutrition || {};
      const price = prod.price || 0;
      const reasons: string[] = [];
      let criteriaCount = 0;
      let criteriaMet = 0;

      // 1. Category filter
      if (params.category && params.category !== 'ALL') {
        if (prod.category.toLowerCase() !== params.category.toLowerCase()) {
          continue; // Strict category filter
        }
      }

      // 2. Budget
      if (params.budget && params.budget > 0) {
        criteriaCount++;
        if (price <= params.budget) {
          criteriaMet++;
          reasons.push(`Within budget (₹${price})`);
        } else {
          continue; // Filter out products strictly over budget
        }
      }

      // 3. Protein
      if (params.minProtein && params.minProtein > 0) {
        criteriaCount++;
        if (nut.protein !== undefined && nut.protein >= params.minProtein) {
          criteriaMet++;
          reasons.push(`High protein: ${nut.protein}g / 100g`);
        }
      }

      // 4. Max Sugar
      if (params.maxSugar !== undefined && params.maxSugar > 0) {
        criteriaCount++;
        if (nut.sugar !== undefined && nut.sugar <= params.maxSugar) {
          criteriaMet++;
          reasons.push(`Controlled sugar: ${nut.sugar}g / 100g`);
        }
      }

      // 5. Max Sodium
      if (params.maxSodium !== undefined && params.maxSodium > 0) {
        criteriaCount++;
        if (nut.sodium !== undefined && nut.sodium <= params.maxSodium) {
          criteriaMet++;
          reasons.push(`Low sodium: ${nut.sodium}mg / 100g`);
        }
      }

      // 6. Min Fiber
      if (params.minFiber !== undefined && params.minFiber > 0) {
        criteriaCount++;
        if (nut.fiber !== undefined && nut.fiber >= params.minFiber) {
          criteriaMet++;
          reasons.push(`Rich fiber: ${nut.fiber}g / 100g`);
        }
      }

      // 7. Max Calories
      if (params.maxCalories !== undefined && params.maxCalories > 0) {
        criteriaCount++;
        if (nut.calories !== undefined && nut.calories <= params.maxCalories) {
          criteriaMet++;
          reasons.push(`Calorie conscious: ${nut.calories} kcal`);
        }
      }

      // 8. Max Fat
      if (params.maxFat !== undefined && params.maxFat > 0) {
        criteriaCount++;
        if (nut.fat !== undefined && nut.fat <= params.maxFat) {
          criteriaMet++;
          reasons.push(`Low fat: ${nut.fat}g / 100g`);
        }
      }

      // Calculate match percentage
      const matchScore = criteriaCount > 0 ? Math.round((criteriaMet / criteriaCount) * 100) : 85;
      const scoreObj = await ScoringService.calculateQualityScore(nut);

      if (criteriaCount === 0 || criteriaMet > 0) {
        results.push({
          product: prod,
          matchScore,
          qualityScore: scoreObj.score,
          highlightReasons: reasons.length > 0 ? reasons : ['Balanced nutritional profile']
        });
      }
    }

    // Sort by criteria
    if (params.sortBy === 'protein') {
      results.sort((a, b) => (b.product.nutrition?.protein || 0) - (a.product.nutrition?.protein || 0));
    } else if (params.sortBy === 'price_asc') {
      results.sort((a, b) => (a.product.price || 0) - (b.product.price || 0));
    } else if (params.sortBy === 'calories_asc') {
      results.sort((a, b) => (a.product.nutrition?.calories || 9999) - (b.product.nutrition?.calories || 9999));
    } else {
      // Default: matchScore then qualityScore
      results.sort((a, b) => b.matchScore - a.matchScore || b.qualityScore - a.qualityScore);
    }

    return results;
  }
}
