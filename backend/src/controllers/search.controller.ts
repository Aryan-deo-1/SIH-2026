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
    const startTime = Date.now();
    try {
      // 1. Validate request payload (Task 4 & Task 8)
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid request body. Expected a JSON object with optional "query" and "category" fields.' }
        });
      }

      if (req.body.query !== undefined && typeof req.body.query !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid "query" field. Query must be a string.' }
        });
      }

      if (req.body.category !== undefined && typeof req.body.category !== 'string') {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid "category" field. Category must be a string.' }
        });
      }

      const rawQuery = typeof req.body.query === 'string' ? req.body.query : '';
      const category = typeof req.body.category === 'string' && req.body.category.trim() ? req.body.category.trim() : 'ALL';
      const cleanQuery = rawQuery.trim();

      // Log request received (safe, no secrets logged)
      console.log(`[SearchController] Request received: query="${cleanQuery}", category="${category}"`);

      // 2. Search internal PostgreSQL database / memory dataset
      console.log(`[SearchController] Database search started for query="${cleanQuery}", category="${category}"`);
      let rawInternal: any[] = [];
      try {
        rawInternal = await dbService.searchProducts(cleanQuery, category);
      } catch (dbErr: any) {
        console.warn('[SearchController] Database search warning (using fallback):', dbErr?.message || dbErr);
        rawInternal = [];
      }

      const internalMatches: StandardProduct[] = rawInternal
        .map((p) => {
          try {
            return ProductService.formatProductRecord(p);
          } catch {
            return null;
          }
        })
        .filter((p): p is StandardProduct => p !== null);

      console.log(`[SearchController] Database search completed: ${internalMatches.length} match(es) found`);

      // 3. Query external provider (Open Food Facts) if query has at least 2 characters
      let externalMatches: StandardProduct[] = [];
      if (cleanQuery.length >= 2) {
        console.log(`[SearchController] External API request started: searching Open Food Facts for "${cleanQuery}"...`);
        try {
          externalMatches = await externalProductService.searchByName(cleanQuery);
          console.log(`[SearchController] External API request completed: ${externalMatches.length} match(es) discovered`);
        } catch (extErr: any) {
          console.warn('[SearchController] External API search warning (non-fatal):', extErr?.message || extErr);
          externalMatches = [];
        }
      }

      // 4. Merge and deduplicate products (by barcode or ID)
      const mergedMap = new Map<string, StandardProduct>();

      // Add internal matches first (verified / cached)
      for (const prod of internalMatches) {
        const key = prod.barcodeGtIN || prod.id;
        if (key) mergedMap.set(key, prod);
      }

      // Add external matches if not already present
      let hasNewExternal = false;
      for (const prod of externalMatches) {
        const key = prod.barcodeGtIN || prod.id;
        if (key && !mergedMap.has(key)) {
          // Verify category match if specified
          if (category && category !== 'ALL') {
            if ((prod.category || '').toLowerCase() !== category.toLowerCase()) {
              continue;
            }
          }
          mergedMap.set(key, prod);
          hasNewExternal = true;
        }
      }

      const allMerged = Array.from(mergedMap.values());

      // 5. If no products found
      if (allMerged.length === 0) {
        const duration = Date.now() - startTime;
        console.log(`[SearchController] Search finished in ${duration}ms: 0 results`);
        return res.json({
          success: true,
          found: false,
          source: null,
          data: [],
          message: cleanQuery
            ? `No products matching "${cleanQuery}" found in database or external registry.`
            : 'No products available for the selected category.'
        });
      }

      // 6. Enrich with quality scores safely
      const enriched = await Promise.all(
        allMerged.map(async (prod) => {
          try {
            const scoreObj = await ScoringService.calculateQualityScore(prod.nutrition);
            return { product: prod, score: scoreObj };
          } catch (scoreErr) {
            return { product: prod, score: { score: 3.0, grade: 'C', baseScore: 5.0, factors: [], summary: 'Standard profile.' } };
          }
        })
      );

      const duration = Date.now() - startTime;
      console.log(`[SearchController] Search finished successfully in ${duration}ms: ${enriched.length} result(s) returned`);

      return res.json({
        success: true,
        found: true,
        source: hasNewExternal ? 'EXTERNAL_API' : 'INTERNAL_DB',
        data: enriched
      });
    } catch (error: any) {
      console.error('[SearchController] Unhandled manual search error:', error?.message || error);
      return res.status(500).json({
        success: false,
        error: { message: 'An internal server error occurred while performing search.' }
      });
    }
  }

  /**
   * Product search via GET /api/products/search?q=lays&category=Chips
   */
  public static async searchProducts(req: Request, res: Response) {
    req.body = {
      query: req.query.q || req.query.query || req.query.search || '',
      category: req.query.category || 'ALL'
    };
    return SearchController.manualSearch(req, res);
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
