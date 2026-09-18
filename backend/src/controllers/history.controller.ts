import { Request, Response } from 'express';
import { dbService } from '../services/db.service';
import { ScoringService } from '../services/scoring.service';
import { ProductService } from '../services/product.service';

export class HistoryController {
  /**
   * Get recent scan history
   * GET /api/history
   */
  public static async getHistory(req: Request, res: Response) {
    try {
      const scans = await dbService.getScanHistory(30);

      const enriched = await Promise.all(
        scans.map(async (scan) => {
          let scoreObj: any = null;
          let formattedProduct: any = null;

          if (scan.product) {
            formattedProduct = ProductService.formatProductRecord(scan.product);
            scoreObj = await ScoringService.calculateQualityScore(formattedProduct.nutrition);
          }

          return {
            id: scan.id,
            barcode: scan.barcode,
            createdAt: scan.createdAt,
            imagePath: scan.imagePath,
            product: formattedProduct,
            score: scoreObj,
            verificationStatus: formattedProduct?.verification?.status || 'Verification Unavailable'
          };
        })
      );

      return res.json({
        success: true,
        data: enriched
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message || 'Error fetching scan history' } });
    }
  }

  /**
   * Clear scan history
   * DELETE /api/history
   */
  public static async clearHistory(req: Request, res: Response) {
    try {
      await dbService.deleteScanHistory();
      return res.json({ success: true, message: 'Scan history cleared' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}
