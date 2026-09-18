import { dbService } from './db.service';
import { externalProductService } from './external-product.service';
import { ScoringService } from './scoring.service';
import { WarningService } from './warning.service';
import { PositivesService } from './positives.service';
import { RecommendationService } from './recommendation.service';
import { VerificationService } from './verification.service';
import { StandardProduct, ScanResultPayload, ComplianceCheckResult } from '../types';

export class ProductService {
  /**
   * Resolves a product by barcode using internal DB -> external API (Open Food Facts) flow
   * Returns null if not found. Zero random or mock fallbacks!
   */
  public static async resolveByBarcode(barcode: string): Promise<StandardProduct | null> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) return null;

    // 1. Search internal PostgreSQL database
    const internalProduct = await dbService.getProductByBarcode(cleanBarcode);
    if (internalProduct) {
      return this.formatProductRecord(internalProduct);
    }

    // 2. Query External Product Provider (Open Food Facts via externalProductService)
    console.log(`[ProductService] Barcode ${cleanBarcode} not in internal DB, querying Open Food Facts...`);
    const externalProduct = await externalProductService.searchByBarcode(cleanBarcode);

    if (externalProduct) {
      console.log(`[ProductService] External product discovered: "${externalProduct.name}".`);
      return externalProduct;
    }

    console.log(`[ProductService] Barcode ${cleanBarcode} not found in DB or Open Food Facts.`);
    return null;
  }

  /**
   * Performs full analysis: Quality Score, Warnings, Positives, Compliance, Recommendations
   */
  public static async analyzeProduct(product: StandardProduct, userPreferences?: any): Promise<ScanResultPayload> {
    // 1. Quality score
    const score = await ScoringService.calculateQualityScore(product.nutrition);

    // 2. Warnings
    const warnings = WarningService.generateWarnings(product);

    // 3. Positives
    const positives = PositivesService.generatePositives(product);

    // 4. Compliance against rules
    const rules = await dbService.getRules();
    const compliance: ComplianceCheckResult[] = [];
    const nut = product.nutrition as any;

    if (nut) {
      for (const rule of rules) {
        const val = nut[rule.field];
        if (val !== undefined && val !== null) {
          let passed = true;
          if (rule.operator === 'LTE') passed = val <= rule.threshold;
          else if (rule.operator === 'LT') passed = val < rule.threshold;
          else if (rule.operator === 'GTE') passed = val >= rule.threshold;
          else if (rule.operator === 'GT') passed = val > rule.threshold;

          if (rule.severity === 'POSITIVE') {
            if (passed) {
              compliance.push({
                ruleId: rule.id,
                status: 'COMPLIANT',
                message: rule.message,
                reason: `${rule.field} (${val}) meets benchmark ${rule.operator} ${rule.threshold}`
              });
            }
          } else {
            // Negative/penalty rule
            if (passed) {
              compliance.push({
                ruleId: rule.id,
                status: rule.severity === 'CRITICAL' ? 'NON_COMPLIANT' : 'WARNING',
                message: rule.message,
                reason: `${rule.field} (${val}) violates threshold ${rule.operator} ${rule.threshold}`,
                evidence: `${val} per 100g declared.`
              });
            } else {
              compliance.push({
                ruleId: rule.id,
                status: 'COMPLIANT',
                message: `Within safe limit for ${rule.field}.`,
                reason: `${rule.field} (${val}) complies with regulation threshold.`
              });
            }
          }
        }
      }
    }

    // 5. Recommendations
    const recommendations = await RecommendationService.getRecommendations(product, userPreferences);

    return {
      product,
      score,
      warnings,
      positives,
      compliance,
      recommendations
    };
  }

  /**
   * Helper to format DB records into StandardProduct schema
   */
  public static formatProductRecord(record: any): StandardProduct {
    const nutrition = record.nutrition
      ? {
          servingSize: record.nutrition.servingSize || '100g',
          calories: record.nutrition.calories,
          protein: record.nutrition.protein,
          carbohydrates: record.nutrition.carbohydrates,
          sugar: record.nutrition.sugar,
          addedSugar: record.nutrition.addedSugar,
          fat: record.nutrition.fat,
          saturatedFat: record.nutrition.saturatedFat,
          transFat: record.nutrition.transFat,
          fiber: record.nutrition.fiber,
          sodium: record.nutrition.sodium,
          vitaminA: record.nutrition.vitaminA,
          vitaminC: record.nutrition.vitaminC,
          vitaminD: record.nutrition.vitaminD,
          calcium: record.nutrition.calcium,
          iron: record.nutrition.iron
        }
      : undefined;

    const ingredient = record.ingredient
      ? {
          ingredientText: record.ingredient.ingredientText,
          allergens: Array.isArray(record.ingredient.allergensJson)
            ? record.ingredient.allergensJson
            : []
        }
      : undefined;

    const evidence = record.verificationEvidence && record.verificationEvidence.length > 0
      ? record.verificationEvidence[0]
      : undefined;

    const verification = evidence
      ? {
          authority: evidence.authority,
          identifier: evidence.identifier,
          status: evidence.status,
          evidenceType: evidence.evidenceType,
          sourceUrl: evidence.sourceUrl,
          details: evidence.details
        }
      : undefined;

    return {
      id: record.id,
      name: record.name,
      brand: record.brand,
      category: record.category,
      manufacturer: record.manufacturer,
      barcodeGtIN: record.barcodeGtIN,
      packSize: record.packSize,
      price: record.price,
      imageUrl: record.imageUrl,
      countryOfOrigin: record.countryOfOrigin,
      sourceType: record.sourceType,
      sourceName: record.sourceName,
      externalProductId: record.externalProductId,
      externalUrl: record.externalUrl,
      retrievedAt: record.retrievedAt,
      expiresAt: record.expiresAt,
      provenanceNote: record.provenanceNote,
      nutrition,
      ingredient,
      verification,
      certifications: record.certifications || [],
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}
