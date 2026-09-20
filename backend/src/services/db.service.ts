import { PrismaClient } from '@prisma/client';
import { SEED_PRODUCTS, SEED_RULES } from '../data/seed-data';
import { LEGAL_METROLOGY_RULES_2011 } from './legalMetrologyRules';
import { NormalizationService } from './normalization.service';
import {
  StandardProduct,
  StandardNutrition,
  StandardIngredient,
  StandardVerification,
  LegalMetrologyComplianceResult
} from '../types';
import { ENV } from '../config/env';

/**
 * Ensures the PostgreSQL connection URL includes pool configuration
 * (default connection_limit=10, pool_timeout=15).
 */
function getDatabaseUrlWithPoolConfig(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', '10');
    }
    if (!url.searchParams.has('pool_timeout')) {
      url.searchParams.set('pool_timeout', '15');
    }
    return url.toString();
  } catch {
    // If not standard URL format, append if needed
    if (!rawUrl.includes('connection_limit')) {
      const sep = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${sep}connection_limit=10&pool_timeout=15`;
    }
    return rawUrl;
  }
}

// Instantiate singleton Prisma Client with connection pool configuration
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrlWithPoolConfig(ENV.DATABASE_URL)
    }
  },
  log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
});

class ResilientDatabaseService {
  private isPostgresConnected: boolean = false;
  private memoryProducts: Map<string, any> = new Map();
  private memoryRules: any[] = [];
  private memoryLegalMetrologyRules: any[] = [];
  private memoryComplianceResults: Map<string, any> = new Map();
  private memoryHistory: any[] = [];

  constructor() {
    this.initMemoryFallback();
    // Non-blocking, safe connection test with catch guard
    this.testConnection().catch((err) => {
      console.warn('[DB] Initial background connection probe caught:', err?.message || err);
    });
  }

  private initMemoryFallback() {
    console.log('[DB] Initializing memory dataset fallback with seed data...');
    this.memoryRules = [...SEED_RULES];
    this.memoryLegalMetrologyRules = [...LEGAL_METROLOGY_RULES_2011];

    SEED_PRODUCTS.forEach((p, index) => {
      const id = `prod-seed-${index + 1}`;
      const productObj = {
        id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        manufacturer: p.manufacturer,
        barcodeGtIN: p.barcodeGtIN,
        packSize: p.packSize,
        price: p.price,
        imageUrl: p.imageUrl,
        countryOfOrigin: p.countryOfOrigin,
        sourceType: p.sourceType,
        sourceName: p.sourceName,
        nutrition: { ...p.nutrition, id: `nut-${id}`, productId: id },
        ingredient: {
          id: `ing-${id}`,
          productId: id,
          ingredientText: p.ingredient.ingredientText,
          allergensJson: p.ingredient.allergens
        },
        verificationEvidence: p.verification
          ? [{
              id: `ver-${id}`,
              productId: id,
              authority: p.verification.authority,
              identifier: p.verification.identifier,
              status: p.verification.status,
              evidenceType: p.verification.evidenceType,
              sourceUrl: p.verification.sourceUrl,
              details: p.verification.details
            }]
          : [],
        certifications: p.certifications
          ? p.certifications.map((c, i) => ({
              id: `cert-${id}-${i}`,
              productId: id,
              type: c.type,
              identifier: c.identifier,
              status: c.status,
              source: c.source
            }))
          : []
      };
      this.memoryProducts.set(id, productObj);
      if (p.barcodeGtIN) {
        this.memoryProducts.set(`barcode:${p.barcodeGtIN}`, productObj);
      }
    });
  }

  public async testConnection(): Promise<boolean> {
    try {
      await prisma.$connect();
      // Test a light query
      await prisma.$queryRaw`SELECT 1`;
      this.isPostgresConnected = true;
      console.log('✅ [DB] Connected successfully to PostgreSQL via Prisma!');
      return true;
    } catch (err: any) {
      this.isPostgresConnected = false;
      console.warn('⚠️ [DB] PostgreSQL not currently reachable, active on fast in-memory store:', err.message || err);
      return false;
    }
  }

  public get isConnected(): boolean {
    return this.isPostgresConnected;
  }

  // --- Product Operations ---
  public async getProductById(id: string): Promise<any | null> {
    if (this.isPostgresConnected) {
      try {
        const prod = await prisma.product.findUnique({
          where: { id },
          include: {
            nutrition: true,
            ingredient: true,
            verificationEvidence: true,
            certifications: true
          }
        });
        if (prod) return prod;
      } catch (err) {
        console.error('[DB] Postgres getProductById error, falling back to memory', err);
      }
    }
    return this.memoryProducts.get(id) || null;
  }

  public async getProductByBarcode(barcode: string): Promise<any | null> {
    const cleanBarcode = barcode.trim();
    if (this.isPostgresConnected) {
      try {
        const prod = await prisma.product.findFirst({
          where: { barcodeGtIN: cleanBarcode },
          include: {
            nutrition: true,
            ingredient: true,
            verificationEvidence: true,
            certifications: true
          }
        });
        if (prod) return prod;
      } catch (err) {
        console.error('[DB] Postgres getProductByBarcode error, falling back to memory', err);
      }
    }
    return this.memoryProducts.get(`barcode:${cleanBarcode}`) || null;
  }

  public async searchProducts(query: string, category?: string): Promise<any[]> {
    const rawClean = (query || '').trim();
    const cleanQ = NormalizationService.cleanSearchQuery(rawClean);
    const tokens = NormalizationService.tokenize(rawClean);

    // 1. If PostgreSQL is connected via Prisma
    if (this.isPostgresConnected) {
      try {
        const whereClause: any = {};

        if (tokens.length > 0) {
          // Every search token should match at least one of [name, brand, category, barcode]
          whereClause.AND = tokens.map((token) => ({
            OR: [
              { name: { contains: token, mode: 'insensitive' } },
              { brand: { contains: token, mode: 'insensitive' } },
              { category: { contains: token, mode: 'insensitive' } },
              { barcodeGtIN: { contains: token } }
            ]
          }));
        }

        if (category && category !== 'ALL') {
          whereClause.category = { equals: category, mode: 'insensitive' };
        }

        const list = await prisma.product.findMany({
          where: whereClause,
          include: {
            nutrition: true,
            ingredient: true,
            verificationEvidence: true,
            certifications: true
          },
          take: 50
        });

        if (list.length > 0) {
          // Sort by relevance score
          return list.sort((a: typeof list[number], b: typeof list[number]) => {
            const scoreA = NormalizationService.scoreProductMatch(rawClean, a);
            const scoreB = NormalizationService.scoreProductMatch(rawClean, b);
            return scoreB - scoreA;
          });
        }
      } catch (err) {
        console.error('[DB] Postgres searchProducts error, falling back to memory', err);
      }
    }

    // 2. Memory dataset search (handles both offline mode and fallback)
    const results: Array<{ product: any; score: number }> = [];
    const seen = new Set<string>();

    for (const [key, prod] of this.memoryProducts.entries()) {
      if (key.startsWith('barcode:')) continue;
      if (seen.has(prod.id)) continue;

      // Category check
      if (category && category !== 'ALL') {
        if (prod.category.toLowerCase() !== category.toLowerCase()) {
          continue;
        }
      }

      // If query is empty, return all category-matched products
      if (!cleanQ || tokens.length === 0) {
        results.push({ product: prod, score: 50 });
        seen.add(prod.id);
        continue;
      }

      // Score product match using NormalizationService (checks exact, token overlap, prefix, fuzzy)
      const score = NormalizationService.scoreProductMatch(rawClean, prod);
      if (score >= 40) {
        results.push({ product: prod, score });
        seen.add(prod.id);
      }
    }

    // Sort descending by match relevance score
    results.sort((a, b) => b.score - a.score);
    return results.map((r) => r.product);
  }

  /**
   * Matches an OCR-extracted product against PostgreSQL / Memory database records.
   * Multi-stage matching: Barcode -> Brand + Name -> Token Overlap -> Raw Text Search.
   */
  public async findProductByOcr(ocrFields: {
    barcode?: string;
    brand?: string;
    name?: string;
    commodityName?: string;
    rawText?: string;
  }): Promise<{ product: any; matchType: 'barcode' | 'name_match' | 'brand_match' | 'text_search' } | null> {
    // 1. Stage 1: Barcode match
    if (ocrFields.barcode) {
      const byBarcode = await this.getProductByBarcode(ocrFields.barcode);
      if (byBarcode) {
        return { product: byBarcode, matchType: 'barcode' };
      }
    }

    // 2. Stage 2: Extracted Brand + Product Name search
    const brandAndName = [ocrFields.brand, ocrFields.name || ocrFields.commodityName]
      .filter(Boolean)
      .join(' ')
      .trim();

    if (brandAndName) {
      const matches = await this.searchProducts(brandAndName);
      if (matches.length > 0) {
        return { product: matches[0], matchType: 'name_match' };
      }
    }

    // 3. Stage 3: Search by brand alone if brand was identified
    if (ocrFields.brand) {
      const brandMatches = await this.searchProducts(ocrFields.brand);
      if (brandMatches.length > 0) {
        // If multiple, check which product name has the most overlap with OCR raw text
        if (ocrFields.rawText && brandMatches.length > 1) {
          const rawLower = ocrFields.rawText.toLowerCase();
          for (const cand of brandMatches) {
            const nameTokens = NormalizationService.tokenize(cand.name);
            const matchingTokens = nameTokens.filter((t) => rawLower.includes(t));
            if (matchingTokens.length >= 2) {
              return { product: cand, matchType: 'name_match' };
            }
          }
        }
        return { product: brandMatches[0], matchType: 'brand_match' };
      }
    }

    // 4. Stage 4: Raw OCR Text scanning against all products in database
    if (ocrFields.rawText) {
      const cleanedRaw = NormalizationService.cleanOcrText(ocrFields.rawText).toLowerCase();
      const all = await this.getAllProducts();

      let bestScore = 0;
      let bestProduct: any = null;

      for (const p of all) {
        const pBrand = (p.brand || '').toLowerCase().replace(/['’]/g, '');
        const pTokens = NormalizationService.tokenize(p.name);

        let pScore = 0;
        if (pBrand && cleanedRaw.includes(pBrand)) {
          pScore += 50;
        }

        const matchedTokens = pTokens.filter((token) => cleanedRaw.includes(token));
        pScore += (matchedTokens.length / Math.max(1, pTokens.length)) * 50;

        if (pScore > bestScore && pScore >= 60) {
          bestScore = pScore;
          bestProduct = p;
        }
      }

      if (bestProduct) {
        return { product: bestProduct, matchType: 'text_search' };
      }
    }

    return null;
  }

  public async getAllProducts(): Promise<any[]> {
    if (this.isPostgresConnected) {
      try {
        return await prisma.product.findMany({
          include: {
            nutrition: true,
            ingredient: true,
            verificationEvidence: true,
            certifications: true
          }
        });
      } catch (err) {
        console.error('[DB] Postgres getAllProducts error, falling back to memory', err);
      }
    }

    const list: any[] = [];
    const seen = new Set<string>();
    for (const [key, prod] of this.memoryProducts.entries()) {
      if (!key.startsWith('barcode:') && !seen.has(prod.id)) {
        list.push(prod);
        seen.add(prod.id);
      }
    }
    return list;
  }

  public async saveProduct(productData: Partial<StandardProduct>): Promise<any> {
    const id = productData.id || `prod-custom-${Date.now()}`;
    const formattedObj = {
      id,
      name: productData.name || 'Unknown Product',
      brand: productData.brand || 'Generic',
      category: productData.category || 'General Snacks',
      manufacturer: productData.manufacturer || null,
      barcodeGtIN: productData.barcodeGtIN || null,
      packSize: productData.packSize || '100g',
      price: productData.price || 0,
      imageUrl: productData.imageUrl || null,
      countryOfOrigin: productData.countryOfOrigin || 'India',
      sourceType: productData.sourceType || 'INTERNAL',
      sourceName: productData.sourceName || 'PackCheck',
      externalProductId: productData.externalProductId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nutrition: productData.nutrition
        ? { id: `nut-${id}`, productId: id, ...productData.nutrition }
        : null,
      ingredient: productData.ingredient
        ? {
            id: `ing-${id}`,
            productId: id,
            ingredientText: productData.ingredient.ingredientText,
            allergensJson: productData.ingredient.allergens
          }
        : null,
      verificationEvidence: productData.verification
        ? [
            {
              id: `ver-${id}`,
              productId: id,
              authority: productData.verification.authority,
              identifier: productData.verification.identifier,
              status: productData.verification.status,
              evidenceType: productData.verification.evidenceType,
              sourceUrl: productData.verification.sourceUrl || '',
              details: productData.verification.details || ''
            }
          ]
        : [],
      certifications: productData.certifications || []
    };

    if (this.isPostgresConnected) {
      try {
        const created = await prisma.product.create({
          data: {
            id: formattedObj.id,
            name: formattedObj.name,
            brand: formattedObj.brand,
            category: formattedObj.category,
            manufacturer: formattedObj.manufacturer,
            barcodeGtIN: formattedObj.barcodeGtIN,
            packSize: formattedObj.packSize,
            price: formattedObj.price,
            imageUrl: formattedObj.imageUrl,
            countryOfOrigin: formattedObj.countryOfOrigin,
            sourceType: formattedObj.sourceType,
            sourceName: formattedObj.sourceName,
            externalProductId: formattedObj.externalProductId
          }
        });

        if (productData.nutrition) {
          await prisma.nutrition.create({
            data: {
              productId: created.id,
              servingSize: productData.nutrition.servingSize || '100g',
              calories: productData.nutrition.calories,
              protein: productData.nutrition.protein,
              carbohydrates: productData.nutrition.carbohydrates,
              sugar: productData.nutrition.sugar,
              addedSugar: productData.nutrition.addedSugar,
              fat: productData.nutrition.fat,
              saturatedFat: productData.nutrition.saturatedFat,
              transFat: productData.nutrition.transFat,
              fiber: productData.nutrition.fiber,
              sodium: productData.nutrition.sodium
            }
          });
        }

        if (productData.ingredient) {
          await prisma.ingredient.create({
            data: {
              productId: created.id,
              ingredientText: productData.ingredient.ingredientText,
              allergensJson: productData.ingredient.allergens
            }
          });
        }

        if (productData.verification) {
          await prisma.verificationEvidence.create({
            data: {
              productId: created.id,
              authority: productData.verification.authority,
              identifier: productData.verification.identifier,
              status: productData.verification.status,
              evidenceType: productData.verification.evidenceType,
              sourceUrl: productData.verification.sourceUrl,
              details: productData.verification.details
            }
          });
        }

        // Return newly saved product with relations
        return await this.getProductById(created.id);
      } catch (err) {
        console.error('[DB] Postgres saveProduct failed, storing in memory fallback', err);
      }
    }

    this.memoryProducts.set(id, formattedObj);
    if (formattedObj.barcodeGtIN) {
      this.memoryProducts.set(`barcode:${formattedObj.barcodeGtIN}`, formattedObj);
    }
    return formattedObj;
  }

  // --- Rules ---
  public async getRules(): Promise<any[]> {
    if (this.isPostgresConnected) {
      try {
        const rules = await prisma.rule.findMany({ where: { active: true } });
        if (rules.length > 0) return rules;
      } catch (err) {
        console.error('[DB] Postgres getRules error, using memory rules', err);
      }
    }
    return this.memoryRules;
  }

  // --- Scan History ---
  public async recordScan(scanData: {
    productId?: string;
    barcode?: string;
    rawOcr?: string;
    extractedJson?: any;
    imagePath?: string;
  }): Promise<any> {
    const scanItem = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...scanData,
      createdAt: new Date().toISOString()
    };

    if (this.isPostgresConnected && scanData.productId) {
      try {
        const dbScan = await prisma.scan.create({
          data: {
            productId: scanData.productId,
            barcode: scanData.barcode,
            rawOcr: scanData.rawOcr,
            extractedJson: scanData.extractedJson,
            imagePath: scanData.imagePath
          },
          include: { product: { include: { nutrition: true, verificationEvidence: true } } }
        });
        return dbScan;
      } catch (err) {
        console.error('[DB] Postgres recordScan failed, saving to memory history', err);
      }
    }

    this.memoryHistory.unshift(scanItem);
    return scanItem;
  }

  public async getScanHistory(limit: number = 20): Promise<any[]> {
    if (this.isPostgresConnected) {
      try {
        const scans = await prisma.scan.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              include: {
                nutrition: true,
                verificationEvidence: true
              }
            }
          }
        });
        if (scans.length > 0) return scans;
      } catch (err) {
        console.error('[DB] Postgres getScanHistory error, using memory', err);
      }
    }

    return this.memoryHistory.slice(0, limit).map((scan) => {
      const prod = scan.productId ? this.memoryProducts.get(scan.productId) : null;
      return {
        ...scan,
        product: prod
      };
    });
  }

  public async deleteScanHistory(): Promise<void> {
    if (this.isPostgresConnected) {
      try {
        await prisma.scan.deleteMany();
      } catch (err) {
        console.error('[DB] Postgres deleteScanHistory error', err);
      }
    }
    this.memoryHistory = [];
  }

  // --- Legal Metrology (Rules 2011) Operations ---
  public async getLegalMetrologyRules(): Promise<any[]> {
    if (this.isPostgresConnected) {
      try {
        const rules = await (prisma as any).legalMetrologyRule.findMany();
        if (rules.length > 0) return rules;
      } catch (err) {
        console.error('[DB] Postgres getLegalMetrologyRules error, using memory rules', err);
      }
    }
    return this.memoryLegalMetrologyRules;
  }

  public async saveComplianceResult(
    compliance: LegalMetrologyComplianceResult,
    productId?: string,
    scanId?: string
  ): Promise<any> {
    const id = `comp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      id,
      productId: productId || null,
      scanId: scanId || null,
      overallStatus: compliance.overallStatus,
      totalMandatory: compliance.summary.totalMandatory,
      passedCount: compliance.summary.passed,
      failedCount: compliance.summary.failed,
      reviewCount: compliance.summary.review,
      notApplicableCount: compliance.summary.notApplicable,
      mpeJson: compliance.mpe || null,
      extractedDeclarations: compliance.extractedDeclarations,
      warningsJson: compliance.warnings,
      scanDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      checkItems: compliance.checks.map((c, i) => ({
        id: `check-${id}-${i}`,
        complianceResultId: id,
        ruleId: c.ruleId,
        ruleCode: c.ruleCode,
        requirement: c.requirement,
        detectedValue: c.detectedValue || null,
        originalValue: c.originalValue || null,
        normalizedValue: c.normalizedValue || null,
        status: c.status,
        reason: c.reason,
        ocrConfidence: c.ocrConfidence,
        confidenceLabel: c.confidenceLabel,
        mandatory: c.mandatory,
        legalReference: c.legalReference
      }))
    };

    if (this.isPostgresConnected) {
      try {
        const created = await (prisma as any).complianceResult.create({
          data: {
            id: record.id,
            productId: record.productId,
            scanId: record.scanId,
            overallStatus: record.overallStatus,
            totalMandatory: record.totalMandatory,
            passedCount: record.passedCount,
            failedCount: record.failedCount,
            reviewCount: record.reviewCount,
            notApplicableCount: record.notApplicableCount,
            mpeJson: record.mpeJson,
            extractedDeclarations: record.extractedDeclarations,
            warningsJson: record.warningsJson,
            checkItems: {
              create: record.checkItems.map((ci) => ({
                id: ci.id,
                ruleCode: ci.ruleCode,
                requirement: ci.requirement,
                detectedValue: ci.detectedValue,
                originalValue: ci.originalValue,
                normalizedValue: ci.normalizedValue,
                status: ci.status,
                reason: ci.reason,
                ocrConfidence: ci.ocrConfidence,
                confidenceLabel: ci.confidenceLabel,
                mandatory: ci.mandatory,
                legalReference: ci.legalReference
              }))
            }
          },
          include: { checkItems: true }
        });
        return created;
      } catch (err) {
        console.error('[DB] Postgres saveComplianceResult error, saving to memory fallback', err);
      }
    }

    this.memoryComplianceResults.set(id, record);
    if (productId) {
      this.memoryComplianceResults.set(`prod:${productId}`, record);
    }
    return record;
  }

  public async getComplianceResultByProductId(productId: string): Promise<any | null> {
    if (this.isPostgresConnected) {
      try {
        const res = await (prisma as any).complianceResult.findFirst({
          where: { productId },
          orderBy: { createdAt: 'desc' },
          include: { checkItems: true }
        });
        if (res) return res;
      } catch (err) {
        console.error('[DB] Postgres getComplianceResultByProductId error', err);
      }
    }
    return this.memoryComplianceResults.get(`prod:${productId}`) || null;
  }

  public async getComplianceResultById(id: string): Promise<any | null> {
    if (this.isPostgresConnected) {
      try {
        const res = await (prisma as any).complianceResult.findUnique({
          where: { id },
          include: { checkItems: true }
        });
        if (res) return res;
      } catch (err) {
        console.error('[DB] Postgres getComplianceResultById error', err);
      }
    }
    return this.memoryComplianceResults.get(id) || null;
  }
}

export const dbService = new ResilientDatabaseService();

