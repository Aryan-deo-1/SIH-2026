import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { OCRService } from '../services/ocr.service';
import { BarcodeService } from '../services/barcode.service';
import { VerificationService } from '../services/verification.service';
import { externalProductService } from '../services/external-product.service';
import { dbService } from '../services/db.service';
import { StandardProduct } from '../types';

export class ScanController {
  /**
   * Main scan endpoint: handles barcode, uploaded image(s), OCR, multi-priority resolution, and analysis
   * POST /api/scan
   */
  public static async scan(req: Request, res: Response) {
    try {
      const barcodeInput = req.body.barcode;
      const files = req.files as any;
      let singleFile = req.file;

      if (!singleFile && files) {
        if (Array.isArray(files) && files.length > 0) {
          singleFile = files[0];
        } else if (typeof files === 'object') {
          const firstKey = Object.keys(files)[0];
          if (firstKey && files[firstKey].length > 0) {
            singleFile = files[firstKey][0];
          }
        }
      }

      let detectedBarcode = barcodeInput;
      let ocrFields: any = null;

      // 1. If an image is provided, run OCR
      if (singleFile) {
        console.log(`[ScanController] Processing uploaded image buffer (${singleFile.size} bytes)...`);
        ocrFields = await OCRService.processImage(singleFile.buffer);

        // If barcode wasn't provided in the body, check if OCR extracted a barcode/GTIN
        if (!detectedBarcode && ocrFields.barcode) {
          detectedBarcode = ocrFields.barcode;
        }
      }

      // 2. Barcode normalization and multi-priority resolution
      let product: StandardProduct | null = null;
      let resolvedVia: 'INTERNAL_DB' | 'EXTERNAL_API' | 'OCR_ONLY' | 'MOCK_PROVIDER' = 'INTERNAL_DB';

      // Priority 1: Look up by barcode (Internal DB -> Open Food Facts)
      if (detectedBarcode) {
        const barcodeValidation = BarcodeService.validateAndNormalize(detectedBarcode);
        const lookupCode = barcodeValidation.normalized || detectedBarcode;
        console.log(`[ScanController] Priority 1: Looking up by barcode "${lookupCode}"...`);
        product = await ProductService.resolveByBarcode(lookupCode);
        if (product) {
          resolvedVia = product.sourceType === 'EXTERNAL_CACHE' ? 'EXTERNAL_API' : 'INTERNAL_DB';
          console.log(`[ScanController] Priority 1 resolved product: "${product.name}" via ${resolvedVia}`);
        }
      }

      // Priority 2: Look up in local database using extracted OCR fields
      if (!product && ocrFields) {
        console.log('[ScanController] Priority 2: Searching local database via findProductByOcr...');
        const dbResult = await dbService.findProductByOcr(ocrFields);
        if (dbResult && dbResult.product) {
          product = ProductService.formatProductRecord(dbResult.product);
          resolvedVia = 'INTERNAL_DB';
          console.log(`[ScanController] Priority 2 resolved product: "${product.name}" (${product.brand}) via INTERNAL_DB`);
        }
      }

      // Priority 3: If still not found, search Open Food Facts by extracted Brand + Product Name
      if (!product && ocrFields && (ocrFields.name || ocrFields.brand)) {
        const candidateName = ocrFields.name || '';
        const candidateBrand = ocrFields.brand || '';
        console.log(`[ScanController] Priority 3: Searching Open Food Facts for brand="${candidateBrand}", name="${candidateName}"...`);
        try {
          const searchMatches = await externalProductService.searchByName(candidateName, candidateBrand);
          if (searchMatches && searchMatches.length > 0) {
            product = searchMatches[0];
            resolvedVia = 'EXTERNAL_API';
            console.log(`[ScanController] Priority 3 resolved product: "${product.name}" (${product.brand})`);
          }
        } catch (extErr: any) {
          console.warn('[ScanController] Open Food Facts search failed or timed out:', extErr.message);
        }
      }

      // Priority 4: If not found in DB or Open Food Facts, construct OCR-derived product from package OCR data
      if (!product && ocrFields && (ocrFields.name || ocrFields.brand || ocrFields.rawText || ocrFields.mrp || ocrFields.nutrition || ocrFields.ingredientsText)) {
        console.log('[ScanController] Priority 4: Constructing product from package OCR data...');
        resolvedVia = 'OCR_ONLY';
        const verification = ocrFields.fssaiNumber
          ? VerificationService.createVerificationObject(ocrFields.fssaiNumber)
          : undefined;

        const ocrProduct: Partial<StandardProduct> = {
          name: ocrFields.name || (ocrFields.brand ? `${ocrFields.brand} Product` : 'Scanned Package Item'),
          brand: ocrFields.brand || 'Unbranded / Scanned',
          category: ocrFields.commodityName || 'Snacks',
          manufacturer: ocrFields.manufacturer,
          barcodeGtIN: detectedBarcode || undefined,
          packSize: ocrFields.packSize || ocrFields.netQuantity || '100g',
          price: ocrFields.price || ocrFields.mrpNumeric,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
          sourceType: 'OCR_PARSED',
          sourceName: 'OCR / Package Image',
          provenanceNote: 'Product identity was not matched in the verified catalog. Analysis and Legal Metrology compliance are evaluated directly from the extracted package declarations.',
          nutrition: ocrFields.nutrition,
          ingredient: {
            ingredientText: ocrFields.ingredientsText || 'Extracted from packaging',
            allergens: ocrFields.allergens || []
          },
          verification
        };

        const saved = await dbService.saveProduct(ocrProduct);
        product = ProductService.formatProductRecord(saved);
      }

      // Priority 5: Not found anywhere and OCR could not extract anything -> Friendly error
      if (!product) {
        console.log('[ScanController] Priority 5: Unreadable image / no text extracted. Returning 404.');
        return res.status(404).json({
          success: false,
          found: false,
          source: null,
          error: {
            message: 'Unable to read the image. Please upload a clearer product-label image.'
          }
        });
      }

      // 5. Analyze product
      const userPreferences = req.body.preferences;
      const analysis = await ProductService.analyzeProduct(product, userPreferences, ocrFields);

      // 6. Record to scan history
      await dbService.recordScan({
        productId: product.id,
        barcode: detectedBarcode,
        rawOcr: ocrFields?.rawText,
        extractedJson: ocrFields,
        imagePath: singleFile ? 'uploaded_memory_image' : undefined
      });

      return res.json({
        success: true,
        found: resolvedVia !== 'OCR_ONLY',
        data: {
          ...analysis,
          scanMeta: {
            barcode: detectedBarcode,
            ocrExtracted: ocrFields,
            resolvedVia
          }
        }
      });
    } catch (error: any) {
      console.error('[ScanController] Scan error:', error);
      return res.status(500).json({
        success: false,
        error: { message: error.message || 'Error processing product scan' }
      });
    }
  }

  /**
   * Standalone OCR endpoint
   * POST /api/ocr
   */
  public static async runOcr(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'Image file required for OCR' } });
      }

      const extracted = await OCRService.processImage(req.file.buffer);
      if (!extracted || !extracted.rawText || extracted.rawText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'Unable to read the image. Please upload a clearer product-label image.' }
        });
      }

      // Check if product matches any known item in DB
      const matchedDbResult = await dbService.findProductByOcr(extracted);
      const product = matchedDbResult && matchedDbResult.product ? ProductService.formatProductRecord(matchedDbResult.product) : null;

      return res.json({
        success: true,
        ocrText: extracted.rawText,
        extracted,
        product,
        matchType: product ? (matchedDbResult?.matchType || 'database') : 'ocr_only'
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message || 'OCR processing failed' } });
    }
  }

  /**
   * Fast Barcode lookup endpoint
   * POST /api/barcode/lookup
   */
  public static async lookupBarcode(req: Request, res: Response) {
    try {
      const { barcode } = req.body;
      if (!barcode) {
        return res.status(400).json({ success: false, error: { message: 'Barcode is required' } });
      }

      const product = await ProductService.resolveByBarcode(barcode);
      if (!product) {
        return res.status(404).json({
          success: false,
          found: false,
          source: null,
          error: { message: `No product found matching barcode ${barcode} in database or Open Food Facts.` }
        });
      }

      const analysis = await ProductService.analyzeProduct(product);

      return res.json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: { message: error.message || 'Barcode lookup failed' } });
    }
  }
}
