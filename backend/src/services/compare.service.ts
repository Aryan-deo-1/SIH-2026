import { dbService } from './db.service';
import { ScoringService } from './scoring.service';
import { StandardProduct, QualityScoreResult } from '../types';
import { ProductService } from './product.service';

export interface CompareProductItem {
  product: StandardProduct;
  score: QualityScoreResult;
}

export interface MetricComparisonRow {
  metric: string;
  unit: string;
  values: (string | number | undefined)[];
  bestIndex?: number; // Index of the product that wins this metric
  highlightText?: string;
}

export interface ComparisonReport {
  products: CompareProductItem[];
  rows: MetricComparisonRow[];
  summary: string;
}

export class CompareService {
  /**
   * Compares 2 to 4 products across key macronutrients, compliance scores, and verification
   */
  public static async compareProducts(productIds: string[]): Promise<ComparisonReport> {
    const products: CompareProductItem[] = [];

    for (const id of productIds.slice(0, 4)) {
      const raw = await dbService.getProductById(id);
      if (raw) {
        const prod = ProductService.formatProductRecord(raw);
        const score = await ScoringService.calculateQualityScore(prod.nutrition);
        products.push({ product: prod, score });
      }
    }

    if (products.length === 0) {
      throw new Error('No valid products found for comparison');
    }

    const rows: MetricComparisonRow[] = [];

    // Quality Score
    const scores = products.map((p) => p.score.score);
    const bestScoreIdx = scores.indexOf(Math.max(...scores));
    rows.push({
      metric: 'Quality Score',
      unit: '/ 5.0',
      values: scores,
      bestIndex: bestScoreIdx,
      highlightText: `Highest: ${products[bestScoreIdx].product.name} (${scores[bestScoreIdx]}/5)`
    });

    // Calories
    const calories = products.map((p) => p.product.nutrition?.calories ?? 'N/A');
    const numericCalories = products.map((p) => p.product.nutrition?.calories ?? 9999);
    const minCalIdx = numericCalories.indexOf(Math.min(...numericCalories));
    rows.push({
      metric: 'Calories',
      unit: 'kcal / 100g',
      values: calories,
      bestIndex: minCalIdx,
      highlightText: `Lowest: ${products[minCalIdx].product.name}`
    });

    // Protein (Higher is better)
    const proteins = products.map((p) => p.product.nutrition?.protein ?? 'N/A');
    const numericProteins = products.map((p) => p.product.nutrition?.protein ?? 0);
    const maxProteinIdx = numericProteins.indexOf(Math.max(...numericProteins));
    rows.push({
      metric: 'Protein',
      unit: 'g / 100g',
      values: proteins,
      bestIndex: maxProteinIdx,
      highlightText: `Highest: ${products[maxProteinIdx].product.name} (${proteins[maxProteinIdx]}g)`
    });

    // Sugar (Lower is better)
    const sugars = products.map((p) => p.product.nutrition?.sugar ?? 'N/A');
    const numericSugars = products.map((p) => p.product.nutrition?.sugar ?? 999);
    const minSugarIdx = numericSugars.indexOf(Math.min(...numericSugars));
    rows.push({
      metric: 'Total Sugar',
      unit: 'g / 100g',
      values: sugars,
      bestIndex: minSugarIdx,
      highlightText: `Lowest sugar: ${products[minSugarIdx].product.name}`
    });

    // Saturated Fat (Lower is better)
    const satFats = products.map((p) => p.product.nutrition?.saturatedFat ?? 'N/A');
    const numericSatFats = products.map((p) => p.product.nutrition?.saturatedFat ?? 999);
    const minSatFatIdx = numericSatFats.indexOf(Math.min(...numericSatFats));
    rows.push({
      metric: 'Saturated Fat',
      unit: 'g / 100g',
      values: satFats,
      bestIndex: minSatFatIdx
    });

    // Fiber (Higher is better)
    const fibers = products.map((p) => p.product.nutrition?.fiber ?? 'N/A');
    const numericFibers = products.map((p) => p.product.nutrition?.fiber ?? 0);
    const maxFiberIdx = numericFibers.indexOf(Math.max(...numericFibers));
    rows.push({
      metric: 'Dietary Fiber',
      unit: 'g / 100g',
      values: fibers,
      bestIndex: maxFiberIdx
    });

    // Sodium (Lower is better)
    const sodiums = products.map((p) => p.product.nutrition?.sodium ?? 'N/A');
    const numericSodiums = products.map((p) => p.product.nutrition?.sodium ?? 9999);
    const minSodiumIdx = numericSodiums.indexOf(Math.min(...numericSodiums));
    rows.push({
      metric: 'Sodium',
      unit: 'mg / 100g',
      values: sodiums,
      bestIndex: minSodiumIdx,
      highlightText: `Lowest sodium: ${products[minSodiumIdx].product.name}`
    });

    // Price
    const prices = products.map((p) => (p.product.price ? `₹${p.product.price}` : 'N/A'));
    rows.push({
      metric: 'Price',
      unit: '₹',
      values: prices
    });

    // Verification Status
    const verifications = products.map((p) => p.product.verification?.status || 'Verification Unavailable');
    rows.push({
      metric: 'FSSAI Verification',
      unit: '',
      values: verifications
    });

    const summary = `Compared ${products.length} products. ${products[bestScoreIdx].product.name} scored highest overall (${scores[bestScoreIdx]}/5).`;

    return {
      products,
      rows,
      summary
    };
  }
}
