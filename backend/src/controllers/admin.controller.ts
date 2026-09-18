import { Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { ProductService } from '../services/product.service';
import { VerificationService } from '../services/verification.service';
import { ENV } from '../config/env';

export class AdminController {
  /**
   * System Statistics & Health
   * GET /api/admin/stats
   */
  public static async getStats(req: Request, res: Response) {
    try {
      const allProducts = await dbService.getAllProducts();
      const rules = await dbService.getRules();
      const history = await dbService.getScanHistory(100);

      // Category counts
      const categories: Record<string, number> = {};
      allProducts.forEach((p) => {
        categories[p.category] = (categories[p.category] || 0) + 1;
      });

      return res.json({
        success: true,
        data: {
          totalProducts: allProducts.length,
          totalRules: rules.length,
          totalScansRecorded: history.length,
          categories,
          databaseStatus: dbService.isConnected ? 'Connected (PostgreSQL)' : 'Active (In-Memory Failover)',
          externalProvider: {
            name: 'OpenFoodFacts API v2',
            url: ENV.EXTERNAL_PRODUCT_API_URL,
            status: 'Operational'
          },
          uptime: process.uptime()
        }
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * Add a new product manually through Admin
   * POST /api/admin/products
   */
  public static async createProduct(req: Request, res: Response) {
    try {
      const body = req.body;
      const verification = body.fssaiNumber
        ? VerificationService.createVerificationObject(body.fssaiNumber)
        : undefined;

      const newProduct = {
        name: body.name,
        brand: body.brand,
        category: body.category,
        manufacturer: body.manufacturer,
        barcodeGtIN: body.barcodeGtIN,
        packSize: body.packSize || '100g',
        price: body.price,
        imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        countryOfOrigin: body.countryOfOrigin || 'India',
        sourceType: 'INTERNAL' as const,
        sourceName: 'Admin Manual Entry',
        nutrition: body.nutrition,
        ingredient: body.ingredient,
        verification
      };

      const saved = await dbService.saveProduct(newProduct);
      return res.status(201).json({
        success: true,
        data: ProductService.formatProductRecord(saved)
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  /**
   * List compliance rules
   * GET /api/admin/rules
   */
  public static async getRules(req: Request, res: Response) {
    try {
      const rules = await dbService.getRules();
      return res.json({ success: true, data: rules });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}
