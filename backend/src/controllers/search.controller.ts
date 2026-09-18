import { Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { externalProductService } from '../services/external-product.service';
import { ProductService } from '../services/product.service';
import { DietService } from '../services/diet.service';
import { ScoringService } from '../services/scoring.service';
import { StandardProduct } from '../types';

export class SearchController {
  /**
   * Manual product search by name, brand, or barcode across internal DB and Open Food Facts
   * POST /api/search/manual
   */
  public static async manualSearch(req: Request, res: Response) {
    try {
      const { query = '', category = 'ALL' } = req.body;
      const cleanQuery = query.trim();

      // 1. Search internal PostgreSQL database
      const rawInternal = await dbService.searchProducts(cleanQuery, category);
      const internalMatches: StandardProduct[] = rawInternal.map((p) => ProductService.formatProductRecord(p));

      // 2. Query external provider (Open Food Facts) if a query keyword is provided
      let externalMatches: StandardProduct[] = [];
      if (cleanQuery.length >= 2) {
        console.log(`[SearchController] Searching Open Food Facts for query: "${cleanQuery}"...`);
        try {
          externalMatches = await externalProductService.searchByName(cleanQuery);
        } catch (extErr) {
          console.warn('[SearchController] External search non-fatal error:', extErr);
        }
      }

      // 3. Merge and deduplicate products (by barcode, ID, or exact name)
      const mergedMap = new Map<string, StandardProduct>();

      // Add internal matches first (they are verified/cached)
      for (const prod of internalMatches) {
        const key = prod.barcodeGtIN || prod.id;
        mergedMap.set(key, prod);
      }

      // Add external matches if not already present
      let hasNewExternal = false;
      for (const prod of externalMatches) {
        const key = prod.barcodeGtIN || prod.id;
        if (!mergedMap.has(key)) {
          // Check if category matches if specified
          if (category && category !== 'ALL') {
            if (prod.category.toLowerCase() !== category.toLowerCase()) {
              continue;
            }
          }
          mergedMap.set(key, prod);
          hasNewExternal = true;
        }
      }

      const allMerged = Array.from(mergedMap.values());

      // 4. If no products found anywhere
      if (allMerged.length === 0) {
        return res.status(404).json({
          success: false,
          found: false,
          source: null,
          data: [],
          error: {
            message: cleanQuery
              ? `No products matching "${cleanQuery}" found in database or Open Food Facts.`
              : 'No products available for the selected category.'
          }
        });
      }

      // 5. Enrich with quality scores
      const enriched = await Promise.all(
        allMerged.map(async (prod) => {
          const scoreObj = await ScoringService.calculateQualityScore(prod.nutrition);
          return {
            product: prod,
            score: scoreObj
          };
        })
      );

      return res.json({
        success: true,
        found: true,
        source: hasNewExternal ? 'EXTERNAL_API' : 'INTERNAL_DB',
        data: enriched
      });
    } catch (error: any) {
      console.error('[SearchController] Manual search error:', error);
      return res.status(500).json({ success: false, error: { message: error.message || 'Search failed' } });
    }
  }

  /**
   * Diet Finder search with customizable macro limits
   * POST /api/search/diet
   */
  public static async dietSearch(req: Request, res: Response) {
    try {
      const params = req.body;
      const matches = await DietService.findProductsByDiet(params);

      return res.json({
        success: true,
        count: matches.length,
        data: matches
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message || 'Diet search failed' } });
    }
  }
}
