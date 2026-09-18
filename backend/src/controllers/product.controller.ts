import { Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { ProductService } from '../services/product.service';
import { ScoringService } from '../services/scoring.service';
import { WarningService } from '../services/warning.service';
import { PositivesService } from '../services/positives.service';
import { RecommendationService } from '../services/recommendation.service';

export class ProductController {
  /**
   * Complete product dashboard payload
   * GET /api/products/:id
   */
  public static async getProduct(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);

      if (!raw) {
        return res.status(404).json({ success: false, error: { message: 'Product not found' } });
      }

      const product = ProductService.formatProductRecord(raw);
      const analysis = await ProductService.analyzeProduct(product);

      return res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message || 'Error fetching product' } });
    }
  }

  /**
   * Product Nutrition
   * GET /api/products/:id/nutrition
   */
  public static async getNutrition(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);
      if (!raw) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

      const product = ProductService.formatProductRecord(raw);
      return res.json({ success: true, data: product.nutrition || {} });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * Product Warnings
   * GET /api/products/:id/warnings
   */
  public static async getWarnings(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);
      if (!raw) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

      const product = ProductService.formatProductRecord(raw);
      const warnings = WarningService.generateWarnings(product);
      return res.json({ success: true, data: warnings });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * Product Positives
   * GET /api/products/:id/positives
   */
  public static async getPositives(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);
      if (!raw) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

      const product = ProductService.formatProductRecord(raw);
      const positives = PositivesService.generatePositives(product);
      return res.json({ success: true, data: positives });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * Product Compliance
   * GET /api/products/:id/compliance
   */
  public static async getCompliance(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);
      if (!raw) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

      const product = ProductService.formatProductRecord(raw);
      const analysis = await ProductService.analyzeProduct(product);
      return res.json({ success: true, data: analysis.compliance });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * Product Verification
   * GET /api/products/:id/verification
   */
  public static async getVerification(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);
      if (!raw) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

      const product = ProductService.formatProductRecord(raw);
      return res.json({
        success: true,
        data: product.verification || {
          authority: 'FSSAI',
          status: 'Verification Unavailable',
          evidenceType: 'NOT_FOUND',
          details: 'Official verification records unavailable for this product.'
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * Product Recommendations
   * GET /api/products/:id/recommendations
   */
  public static async getRecommendations(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const raw = await dbService.getProductById(id);
      if (!raw) return res.status(404).json({ success: false, error: { message: 'Product not found' } });

      const product = ProductService.formatProductRecord(raw);
      const recs = await RecommendationService.getRecommendations(product);
      return res.json({ success: true, data: recs });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * All products list (for search/catalog)
   * GET /api/products
   */
  public static async getAllProducts(req: Request, res: Response) {
    try {
      const category = req.query.category as string;
      const search = req.query.search as string;

      let list: any[];
      if (search || category) {
        list = await dbService.searchProducts(search || '', category);
      } else {
        list = await dbService.getAllProducts();
      }

      const formatted = list.map((p) => ProductService.formatProductRecord(p));
      return res.json({ success: true, data: formatted });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}
