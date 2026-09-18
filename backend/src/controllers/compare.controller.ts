import { Request, Response } from 'express';
import { CompareService } from '../services/compare.service';

export class CompareController {
  /**
   * Product Comparison
   * POST /api/compare
   */
  public static async compare(req: Request, res: Response) {
    try {
      const { productIds } = req.body;
      if (!productIds || !Array.isArray(productIds) || productIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: { message: 'At least 2 product IDs are required for comparison' }
        });
      }

      const report = await CompareService.compareProducts(productIds);
      return res.json({
        success: true,
        data: report
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Comparison failed' }
      });
    }
  }
}
