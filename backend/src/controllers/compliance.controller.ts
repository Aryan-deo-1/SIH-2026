import { Request, Response } from 'express';
import { LegalMetrologyComplianceEngine } from '../services/complianceEngine';
import { dbService } from '../services/db.service';
import { LegalMetrologyExtractedFields } from '../types';

export class ComplianceController {
  /**
   * Evaluates product package declarations against Legal Metrology (Packaged Commodities) Rules, 2011
   * POST /api/compliance/check
   */
  public static async checkCompliance(req: Request, res: Response) {
    try {
      const productData: Partial<LegalMetrologyExtractedFields> = req.body.productData || req.body;

      if (!productData || Object.keys(productData).length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'productData object is required for compliance evaluation.' }
        });
      }

      // Run Legal Metrology Compliance Engine
      const result = LegalMetrologyComplianceEngine.evaluateProduct(productData);

      // Optional: if a productId is provided, persist it
      if (req.body.productId) {
        try {
          await dbService.saveComplianceResult(result, req.body.productId);
        } catch (e) {
          console.warn('[ComplianceController] Save failed:', e);
        }
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('[ComplianceController] checkCompliance error:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Error executing compliance check' }
      });
    }
  }

  /**
   * Retrieves active Legal Metrology Rules catalog
   * GET /api/compliance/rules
   */
  public static async getRules(req: Request, res: Response) {
    try {
      const rules = await dbService.getLegalMetrologyRules();
      return res.json({
        success: true,
        data: rules
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Error fetching compliance rules' }
      });
    }
  }

  /**
   * Retrieves stored compliance result by record ID
   * GET /api/compliance/results/:id
   */
  public static async getResultById(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const result = await dbService.getComplianceResultById(id);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: `Compliance result with id "${id}" not found.` }
        });
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Error retrieving compliance result' }
      });
    }
  }

  /**
   * Retrieves latest stored compliance result for a product
   * GET /api/compliance/product/:productId
   */
  public static async getResultByProductId(req: Request, res: Response) {
    try {
      const productId = String(req.params.productId);
      const result = await dbService.getComplianceResultByProductId(productId);
      if (!result) {
        return res.status(404).json({
          success: false,
          error: { message: `No compliance result found for product "${productId}".` }
        });
      }

      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Error retrieving product compliance result' }
      });
    }
  }
}
