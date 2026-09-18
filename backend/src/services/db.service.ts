import { PrismaClient } from '@prisma/client';
import { SEED_PRODUCTS, SEED_RULES } from '../data/seed-data';
import { StandardProduct, StandardNutrition, StandardIngredient, StandardVerification } from '../types';

export const prisma = new PrismaClient();

class ResilientDatabaseService {
  private isPostgresConnected: boolean = false;
  private memoryProducts: Map<string, any> = new Map();
  private memoryRules: any[] = [];
  private memoryHistory: any[] = [];

  constructor() {
    this.initMemoryFallback();
    this.testConnection();
  }

  private initMemoryFallback() {
    console.log('[DB] Initializing memory dataset fallback with seed data...');
    this.memoryRules = [...SEED_RULES];

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
    const q = query.toLowerCase().trim();
    if (this.isPostgresConnected) {
      try {
        const whereClause: any = {};
        if (q) {
          whereClause.OR = [
            { name: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { barcodeGtIN: { contains: q } }
          ];
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
        if (list.length > 0) return list;
      } catch (err) {
        console.error('[DB] Postgres searchProducts error, falling back to memory', err);
      }
    }

    // Memory fallback search
    const results: any[] = [];
    const seen = new Set<string>();

    for (const [key, prod] of this.memoryProducts.entries()) {
      if (key.startsWith('barcode:')) continue;
      if (seen.has(prod.id)) continue;

      const matchesQuery =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.brand.toLowerCase().includes(q) ||
        (prod.barcodeGtIN && prod.barcodeGtIN.includes(q));

      const matchesCategory =
        !category || category === 'ALL' || prod.category.toLowerCase() === category.toLowerCase();

      if (matchesQuery && matchesCategory) {
        results.push(prod);
        seen.add(prod.id);
      }
    }

    return results;
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
}

export const dbService = new ResilientDatabaseService();
