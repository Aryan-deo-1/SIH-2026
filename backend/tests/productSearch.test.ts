import { describe, it, expect } from 'vitest';
import { NormalizationService } from '../src/services/normalization.service';
import { dbService } from '../src/services/db.service';
import { OCRService } from '../src/services/ocr.service';

describe('Product Search and Text Normalization', () => {
  it('should clean and standardize search queries (case, apostrophes, punctuation, spaces)', () => {
    expect(NormalizationService.cleanSearchQuery("LAY'S")).toBe('lays');
    expect(NormalizationService.cleanSearchQuery("  Lay's  Chips! ")).toBe('lays chips');
    expect(NormalizationService.cleanSearchQuery("Lays-Classic")).toBe('lays classic');
    expect(NormalizationService.cleanSearchQuery("LAYS")).toBe('lays');
  });

  it('should tokenize queries into individual search terms', () => {
    expect(NormalizationService.tokenize("LAY'S Classic Chips")).toEqual(['lays', 'classic', 'chips']);
    expect(NormalizationService.tokenize('  lays   chips  ')).toEqual(['lays', 'chips']);
  });

  it('should fix common OCR character substitutions in uppercase text', () => {
    // 5 -> S
    expect(NormalizationService.cleanOcrText('LAY5')).toBe('LAYS');
    expect(NormalizationService.cleanOcrText('5ALTED')).toBe('SALTED');
    // l -> I
    expect(NormalizationService.cleanOcrText('CLASSlC')).toBe('CLASSIC');
    // Combined
    expect(NormalizationService.cleanOcrText('LAY5 CLASSlC')).toBe('LAYS CLASSIC');
    // Net weight OCR substitution (500 9 -> 500 g)
    expect(NormalizationService.cleanOcrText('Net Wt. 500 9')).toBe('Net Wt. 500 g');
  });

  it('should match search query variations (Lays, lays, LAY\'S, lay, lays chips) against database', async () => {
    const variations = ['Lays', 'lays', "LAY'S", 'lay', 'lays chips'];

    for (const query of variations) {
      const results = await dbService.searchProducts(query);
      expect(results.length).toBeGreaterThan(0);
      const matchedBrandOrName = results.some(
        (p) => p.brand.toLowerCase().includes('lay') || p.name.toLowerCase().includes('lay')
      );
      expect(matchedBrandOrName).toBe(true);
    }
  });

  it('should return empty array without throwing when no products match', async () => {
    const results = await dbService.searchProducts('xyznonexistentquery99999');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });

  it('should score product matches accurately', () => {
    const product = {
      name: "Lay's Classic Salted Potato Chips",
      brand: "Lay's",
      category: 'Chips',
      barcodeGtIN: '8901491101837'
    };

    // Exact barcode match
    expect(NormalizationService.scoreProductMatch('8901491101837', product)).toBe(100);

    // Exact brand match
    expect(NormalizationService.scoreProductMatch("LAY'S", product)).toBe(95);
    expect(NormalizationService.scoreProductMatch('lays', product)).toBe(95);

    // Multi-token match
    expect(NormalizationService.scoreProductMatch('lays chips', product)).toBeGreaterThanOrEqual(75);

    // Substring / prefix match
    expect(NormalizationService.scoreProductMatch('lay', product)).toBeGreaterThanOrEqual(70);

    // Completely unrelated
    expect(NormalizationService.scoreProductMatch('unrelated shampoo xyz', product)).toBe(0);
  });

  it('should recognize brand from OCR text containing substitutions (e.g. LAY5 CLASSlC)', () => {
    const noisyOcr = `
      LAY5 CLASSlC SALTED
      POTATO CHIPS
      Net Wt. 50g
      MRP Rs. 20.00
      Mfd By: PepsiCo India Holdings Pvt. Ltd.
      FSSAI Lic No: 10014047000107
    `;

    const parsed = OCRService.parsePackageText(noisyOcr);
    expect(parsed.brand).toBe("Lay's");
    expect(parsed.mrpNumeric).toBe(20);
    expect(parsed.fssaiNumber).toBe('10014047000107');
  });

  it('should find product in DB using OCR extracted fields', async () => {
    const ocrFields = {
      brand: "Lay's",
      name: 'Classic Salted Potato Chips',
      rawText: 'LAY5 CLASSlC SALTED POTATO CHIPS'
    };

    const matched = await dbService.findProductByOcr(ocrFields);
    expect(matched).not.toBeNull();
    expect(matched?.product).toBeDefined();
    expect(matched?.product.brand.toLowerCase()).toContain('lay');
  });

  it('SearchController.manualSearch should return HTTP 200 with found: false and data: [] on zero matches', async () => {
    const { SearchController } = await import('../src/controllers/search.controller');
    const { externalProductService } = await import('../src/services/external-product.service');
    const { vi } = await import('vitest');

    const spy = vi.spyOn(externalProductService, 'searchByName').mockResolvedValue([]);

    let responseStatus = 200;
    let responseBody: any = null;

    const mockReq: any = {
      body: { query: 'xyznonexistent99999', category: 'ALL' }
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseBody = data;
        return mockRes;
      }
    };

    await SearchController.manualSearch(mockReq, mockRes);
    expect(responseStatus).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.found).toBe(false);
    expect(responseBody.data).toEqual([]);

    spy.mockRestore();
  });

  it('SearchController.manualSearch should return HTTP 200 and matches for LAY\'S', async () => {
    const { SearchController } = await import('../src/controllers/search.controller');
    let responseStatus = 200;
    let responseBody: any = null;

    const mockReq: any = {
      body: { query: "LAY'S", category: 'ALL' }
    };
    const mockRes: any = {
      status: (code: number) => {
        responseStatus = code;
        return mockRes;
      },
      json: (data: any) => {
        responseBody = data;
        return mockRes;
      }
    };

    await SearchController.manualSearch(mockReq, mockRes);
    expect(responseStatus).toBe(200);
    expect(responseBody.success).toBe(true);
    expect(responseBody.found).toBe(true);
    expect(responseBody.data.length).toBeGreaterThan(0);
    expect(responseBody.data[0].product.brand.toLowerCase()).toContain('lay');
  }, 15000);

  it('SearchController.manualSearch should return HTTP 400 for missing or invalid request bodies', async () => {
    const { SearchController } = await import('../src/controllers/search.controller');

    const runValidationCase = async (body: any) => {
      let status = 200;
      let jsonResponse: any = null;
      const req: any = { body };
      const res: any = {
        status: (code: number) => {
          status = code;
          return res;
        },
        json: (d: any) => {
          jsonResponse = d;
          return res;
        }
      };
      await SearchController.manualSearch(req, res);
      return { status, jsonResponse };
    };

    // Missing / null body
    const caseNull = await runValidationCase(null);
    expect(caseNull.status).toBe(400);
    expect(caseNull.jsonResponse.success).toBe(false);

    // Non-string query
    const caseQueryNumber = await runValidationCase({ query: 12345 });
    expect(caseQueryNumber.status).toBe(400);
    expect(caseQueryNumber.jsonResponse.error.message).toContain('query');

    // Non-string category
    const caseCatArray = await runValidationCase({ query: 'lays', category: ['Chips'] });
    expect(caseCatArray.status).toBe(400);
    expect(caseCatArray.jsonResponse.error.message).toContain('category');
  });
});
