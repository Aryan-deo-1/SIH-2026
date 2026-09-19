import { createWorker } from 'tesseract.js';
import { StandardNutrition, LegalMetrologyExtractedFields } from '../types';
import { NormalizationService } from './normalization.service';

export interface ExtractedProductFields extends LegalMetrologyExtractedFields {
  rawText: string;
  barcode?: string;
  name?: string;
  brand?: string;
  variant?: string;
  manufacturer?: string;
  packSize?: string;
  price?: number;
  mrp?: string;
  fssaiNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  bestBefore?: string;
  ingredientsText?: string;
  allergens?: string[];
  nutrition?: StandardNutrition;
}

export class OCRService {
  private static knownBrands = [
    "Lay's", "Lays", "Haldiram's", "Haldirams", "Britannia", "Parle", "Amul",
    "Nestle", "Nestlé", "Maggi", "Doritos", "Oreo", "Quaker", "Kurkure",
    "Cadbury", "Tropicana", "Kellogg's", "Kelloggs", "Sunfeast", "Bingo",
    "Bikaji", "Balaji", "Too Yumm", "Epigamia", "Pintola", "Raw Pressery",
    "Slurrp Farm", "Yoga Bar", "RiteBite", "MyFitness", "Bagrry's", "Sundrop",
    "Tata", "Dabur", "Marico", "ITC", "Patanjali", "MTR", "Catch", "Everest",
    "Mother Dairy", "MDH", "Saffola", "Fortune", "Aashirvaad", "Real"
  ];

  private static commonCommodityKeywords = [
    "Potato Chips", "Potato Wafers", "Corn Chips", "Extruded Snacks", "Namkeen",
    "Bhujia", "Sev", "Biscuits", "Cookies", "Crackers", "Wafers",
    "Instant Noodles", "Pasta", "Macaroni", "Vermicelli",
    "Fruit Juice", "Fruit Drink", "Carbonated Beverage", "Energy Drink",
    "Milk", "Flavoured Milk", "Yogurt", "Curd", "Butter", "Cheese", "Paneer", "Ghee",
    "Edible Vegetable Oil", "Mustard Oil", "Sunflower Oil", "Refined Oil",
    "Breakfast Cereal", "Oats", "Corn Flakes", "Muesli",
    "Wheat Flour", "Atta", "Maida", "Besan", "Rice", "Basmati Rice", "Pulses", "Dal",
    "Chocolate", "Candy", "Toffee", "Confectionery", "Peanut Butter",
    "Tea", "Coffee", "Green Tea", "Spices", "Garam Masala", "Turmeric Powder",
    "Chilli Powder", "Tomato Ketchup", "Sauce", "Pickle", "Mayonnaise"
  ];

  /**
   * Performs optical character recognition on an image buffer or file path
   */
  public static async processImage(imageBufferOrPath: Buffer | string): Promise<ExtractedProductFields> {
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBufferOrPath);
      await worker.terminate();

      const text = ret.data.text || '';
      return this.parsePackageText(text);
    } catch (error: any) {
      console.error('[OCRService] Tesseract recognition failed:', error.message);
      return {
        rawText: '',
        nutrition: {}
      };
    }
  }

  /**
   * Extracts structured information from raw package OCR text using domain regex patterns
   * Specifically tuned for Legal Metrology (Packaged Commodities) Rules, 2011 & Nutrition.
   */
  public static parsePackageText(text: string): ExtractedProductFields {
    const raw = text.replace(/\r/g, '\n');
    const cleaned = NormalizationService.cleanOcrText(raw);
    const lines = cleaned.split('\n').map((l) => l.trim()).filter((l) => l.length > 1);

    const confidenceScores: Record<string, number> = {};
    const noiseCandidates: Array<{ field: string; raw: string; candidate: string; confidence: number; note: string }> = [];

    // 1. Check for barcode / GTIN digits (12 to 14 consecutive digits, often starting with 890 for India)
    let barcode: string | undefined;
    const barcodeMatch = cleaned.match(/\b(890\d{10})\b/) || cleaned.match(/\b(\d{13})\b/) || cleaned.match(/\b(\d{12})\b/);
    if (barcodeMatch) {
      barcode = barcodeMatch[1];
      confidenceScores.barcode = 0.98;
    }

    // 2. FSSAI 14-digit license number
    let fssaiNumber: string | undefined;
    const fssaiMatch = cleaned.match(/(?:fssai|lic(?:\.|\s*no)?)[\s\:\-]+(\d{14})/i) || cleaned.match(/\b(100\d{11}|200\d{11})\b/);
    if (fssaiMatch) {
      fssaiNumber = fssaiMatch[1];
      confidenceScores.fssaiNumber = 0.95;
    }

    // 3. Brand detection (Known brand dictionary or prominent top text)
    let brand: string | undefined;
    let name: string | undefined;
    let variant: string | undefined;

    const normalizedTokens = NormalizationService.tokenize(cleaned);
    for (const b of this.knownBrands) {
      const cleanB = NormalizationService.cleanSearchQuery(b);
      const regex = new RegExp(`\\b${b.replace("'", "['’]?")}\\b`, 'i');
      if (regex.test(cleaned) || regex.test(raw)) {
        brand = b;
        confidenceScores.brand = 0.95;
        break;
      }
      if (normalizedTokens.includes(cleanB)) {
        brand = b;
        confidenceScores.brand = 0.92;
        break;
      }
    }

    // Common/Generic Commodity Name detection under Rule 6(1)(b)
    let commodityName: string | undefined;
    for (const comm of this.commonCommodityKeywords) {
      const regex = new RegExp(`\\b${comm.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(raw)) {
        commodityName = comm;
        confidenceScores.commodityName = 0.94;
        break;
      }
    }

    // Heuristics for product name & variant
    if (lines.length > 0) {
      const titleLines = lines.filter(
        (l) => !l.match(/^(fssai|lic|mrp|mfd|exp|net|batch|pkd|use|date|pkg|mfg)/i) && l.length > 2 && l.length < 60
      );

      if (titleLines.length > 0) {
        name = titleLines.slice(0, 2).join(' ');
        if (!brand) {
          brand = titleLines[0].split(' ')[0];
          confidenceScores.brand = 0.75;
        }
        if (!commodityName) {
          commodityName = titleLines[0];
          confidenceScores.commodityName = 0.70;
        }
      }
    }

    // Variant detection
    const variantMatch = raw.match(/\b(Classic Salted|Magic Masala|American Style Cream|Spanish Tomato|Hot.*Sweet|Dark Fantasy|Milk Chocolate|Almond|Crunchy|Masala Noodles|Double Rich Chocolate|Tangy Tomato|Pudina)\b/i);
    if (variantMatch) {
      variant = variantMatch[1];
    }

    // 4. Manufacturer, Packer & Importer Declarations under Rule 6(1)(a) & (ab)
    let manufacturer: string | undefined;
    let manufacturerAddress: string | undefined;
    let packer: string | undefined;
    let packerAddress: string | undefined;
    let importer: string | undefined;
    let importerAddress: string | undefined;

    // Manufacturer extraction
    const mfgMatch = raw.match(/(?:mfd\.?\s*by|manufactured\s*(?:&|and)?\s*packed\s*by|manufactured\s*by)[\s\:\-]+([^\.\n]+(?:\n[^\.\n]+)?)/i);
    if (mfgMatch) {
      const mfgText = mfgMatch[1].replace(/\n/g, ', ').trim();
      manufacturer = mfgText.split(/,|\bat\b/i)[0].trim();
      manufacturerAddress = mfgText;
      confidenceScores.manufacturer = 0.92;
    }

    // Packer extraction
    const pkrMatch = raw.match(/(?:packed\s*by|pkd\.?\s*by)[\s\:\-]+([^\.\n]+(?:\n[^\.\n]+)?)/i);
    if (pkrMatch) {
      const pkrText = pkrMatch[1].replace(/\n/g, ', ').trim();
      packer = pkrText.split(/,|\bat\b/i)[0].trim();
      packerAddress = pkrText;
      confidenceScores.packer = 0.90;
    }

    // Importer extraction
    const impMatch = raw.match(/(?:imported\s*(?:&|and)?\s*marketed\s*by|imported\s*by)[\s\:\-]+([^\.\n]+(?:\n[^\.\n]+)?)/i);
    if (impMatch) {
      const impText = impMatch[1].replace(/\n/g, ', ').trim();
      importer = impText.split(/,|\bat\b/i)[0].trim();
      importerAddress = impText;
      confidenceScores.importer = 0.92;
    }

    // Generic address matcher if address missing
    if (manufacturer && !manufacturerAddress) {
      const pinMatch = raw.match(/\b\d{6}\b/);
      if (pinMatch) {
        manufacturerAddress = `Postal Pin: ${pinMatch[0]}, India`;
      }
    }

    // 5. Net Quantity under Rule 6(1)(c) & Rule 11
    let netQuantity: string | undefined;
    let count: number | undefined;

    // Standard net quantity match e.g. "Net Wt. 500 g", "Net Quantity: 1 kg", "Net Qty: 200 ml", "10 N"
    const netQtyRegex = /(?:net\s*(?:wt\.?|weight|qty|quantity)?)[\s\:\-]+(\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|ml|l|ltr|litre|liter|n|u|pcs|pieces|units))\b/i;
    const netQtyMatch = raw.match(netQtyRegex);

    if (netQtyMatch) {
      netQuantity = netQtyMatch[1].trim();
      confidenceScores.netQuantity = 0.95;
    } else {
      // Standalone metric unit search
      const standaloneMetric = raw.match(/\b(\d+(?:\.\d+)?\s*(?:kg|ml|gms?|ltr|litre|liter))\b/i);
      if (standaloneMetric) {
        netQuantity = standaloneMetric[1].trim();
        confidenceScores.netQuantity = 0.80;
      }
    }

    // Count detection e.g. "10 N" or "5 Units"
    const countMatch = raw.match(/\b(\d+)\s*(?:N|Units?|Pieces?|Pcs)\b/i);
    if (countMatch) {
      count = parseInt(countMatch[1], 10);
      if (!netQuantity) {
        netQuantity = `${count} N`;
        confidenceScores.netQuantity = 0.90;
      }
    }

    // OCR Noise substitution check: e.g. "500 9" -> candidate "500 g"
    const noiseQtyMatch = raw.match(/(?:net\s*(?:wt|qty)?)[\s\:\-]+(\d+(?:\.\d+)?)\s*9\b/i);
    if (noiseQtyMatch) {
      const rawNoise = noiseQtyMatch[0];
      const candidate = `${noiseQtyMatch[1]} g`;
      if (!netQuantity) {
        netQuantity = `${noiseQtyMatch[1]} 9`;
        confidenceScores.netQuantity = 0.71;
      }
      noiseCandidates.push({
        field: 'netQuantity',
        raw: rawNoise,
        candidate,
        confidence: 0.71,
        note: 'Digit "9" identified as probable OCR substitution for unit "g".'
      });
    }

    const packSize = netQuantity;

    // 6. Maximum Retail Price (MRP) under Rule 6(1)(e)
    let price: number | undefined;
    let mrp: string | undefined;
    const allMrpValues: string[] = [];
    let multipleMrpDetected = false;

    // Global MRP search to find all instances and detect conflicting dual pricing
    const mrpGlobalRegex = /(?:mrp|rs\.?|₹|inr)[\s\:\.]*(\d+(?:\.\d{1,2})?)/gi;
    let mMatch: RegExpExecArray | null;
    const foundPrices = new Set<number>();

    while ((mMatch = mrpGlobalRegex.exec(raw)) !== null) {
      const val = parseFloat(mMatch[1]);
      if (val > 0 && val < 50000) {
        foundPrices.add(val);
        allMrpValues.push(`₹${val}`);
      }
    }

    if (foundPrices.size === 1) {
      price = Array.from(foundPrices)[0];
      mrp = `₹${price}`;
      confidenceScores.mrp = 0.96;
    } else if (foundPrices.size > 1) {
      multipleMrpDetected = true;
      const arr = Array.from(foundPrices);
      price = arr[0];
      mrp = `₹${price}`;
      confidenceScores.mrp = 0.65;
    } else {
      confidenceScores.mrp = 0.1;
    }

    // Unit Sale Price (USP) extraction: e.g. "₹0.50 / g", "Rs. 25/100g", "₹ 2.50 per unit"
    let unitSalePrice: string | undefined;
    const uspMatch = raw.match(/(?:usp|unit\s*sale\s*price)[\s\:\-]+([^\.\n]+)/i) ||
      raw.match(/(?:₹|rs\.?)\s*\d+(?:\.\d{1,2})?\s*(?:\/|\s*per\s*)(?:g|gm|ml|kg|l|unit|piece|100g|100ml)/i);
    if (uspMatch) {
      unitSalePrice = uspMatch[0].trim();
      confidenceScores.unitSalePrice = 0.90;
    }

    // 7. Date Declarations under Rule 6(1)(d)
    let manufacturingDate: string | undefined;
    let packingDate: string | undefined;
    let importDate: string | undefined;
    let normalizedDate: string | undefined;

    // Manufacturing date
    const mfdMatch = raw.match(/(?:mfg|mfd|manufactured)[\s\:\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.\,\-]+\d{4})/i);
    if (mfdMatch) {
      manufacturingDate = mfdMatch[1].trim();
      confidenceScores.date = 0.92;
    }

    // Packing date
    const pkdMatch = raw.match(/(?:pkd|packed)[\s\:\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{4}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.\,\-]+\d{4})/i);
    if (pkdMatch) {
      packingDate = pkdMatch[1].trim();
      confidenceScores.date = 0.92;
    }

    // Import date
    const impDateMatch = raw.match(/(?:imported|import\s*date)[\s\:\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{4})/i);
    if (impDateMatch) {
      importDate = impDateMatch[1].trim();
      confidenceScores.date = 0.92;
    }

    const expMatch = raw.match(/(?:exp|expiry|use\s*by)[\s\:\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}[\/\-\.]\d{4})/i);
    const expiryDate = expMatch ? expMatch[1].trim() : undefined;

    const bbMatch = raw.match(/best\s*before[\s\:\.]*([^\n\.]+)/i);
    const bestBefore = bbMatch ? bbMatch[1].trim() : undefined;

    // Normalize date to MM/YYYY format
    const candidateDate = manufacturingDate || packingDate || importDate;
    if (candidateDate) {
      const parts = candidateDate.split(/[\/\-\.]/);
      if (parts.length >= 2) {
        let month = parts[0];
        let year = parts[parts.length - 1];
        if (parts.length === 3) {
          month = parts[1];
        }
        if (year.length === 2) year = `20${year}`;
        normalizedDate = `${month.padStart(2, '0')}/${year}`;
      } else {
        normalizedDate = candidateDate;
      }
    }

    // 8. Consumer Care Details under Rule 6(1)(n)
    let consumerCarePhone: string | undefined;
    let consumerCareEmail: string | undefined;
    let consumerCareAddress: string | undefined;

    // Toll-free or telephone: 1800-xxx-xxxx or landline/mobile
    const phoneMatch = raw.match(/\b(1800[\s\-]?[0-9]{3}[\s\-]?[0-9]{3,4})\b/) ||
      raw.match(/(?:consumer\s*care|toll\s*free|helpline|call)[\s\:\-]+([0-9\+\-\s]{8,15})/i) ||
      raw.match(/\b(\+91[\s\-]?[0-9]{10}|0[0-9]{2,4}[\s\-]?[0-9]{6,8})\b/);
    if (phoneMatch) {
      consumerCarePhone = (phoneMatch[1] || phoneMatch[0]).trim();
      confidenceScores.consumerCare = 0.94;
    }

    // Email
    const emailMatch = raw.match(/\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/);
    if (emailMatch) {
      consumerCareEmail = emailMatch[1].trim();
      confidenceScores.consumerCare = 0.95;
    }

    // Consumer care physical address / nodal officer
    const careAddrMatch = raw.match(/(?:consumer\s*care\s*cell|for\s*complaints|write\s*to)[\s\:\-]+([^\.\n]+(?:\n[^\.\n]+)?)/i);
    if (careAddrMatch) {
      consumerCareAddress = careAddrMatch[1].replace(/\n/g, ', ').trim();
      confidenceScores.consumerCare = 0.90;
    }

    // 9. Country of Origin under Rule 6(1)(aa)
    let countryOfOrigin: string | undefined;
    const originMatch = raw.match(/(?:country\s*of\s*origin|made\s*in|product\s*of)[\s\:\-]+([a-zA-Z\s]{3,20})/i);
    if (originMatch) {
      countryOfOrigin = originMatch[1].trim();
      confidenceScores.countryOfOrigin = 0.95;
    } else if (raw.match(/\b(made\s*in\s*india|product\s*of\s*india)\b/i)) {
      countryOfOrigin = 'India';
      confidenceScores.countryOfOrigin = 0.98;
    }

    // 10. Dimensions under Rule 6(1)(f)
    let dimensions: string | undefined;
    const dimMatch = raw.match(/\b(\d+(?:\.\d+)?\s*(?:cm|mm|m)\s*[xX*×]\s*\d+(?:\.\d+)?\s*(?:cm|mm|m)(?:\s*[xX*×]\s*\d+(?:\.\d+)?\s*(?:cm|mm|m))?)\b/);
    if (dimMatch) {
      dimensions = dimMatch[1].trim();
      confidenceScores.dimensions = 0.92;
    }

    // 11. Nutrition fields (Kept for health score!)
    const nutrition: StandardNutrition = {
      servingSize: '100g'
    };

    const energyMatch = raw.match(/(?:energy|calories|kcal)[\s\:\-]+(\d+(?:\.\d+)?)\s*(?:kcal)?/i);
    if (energyMatch) nutrition.calories = parseFloat(energyMatch[1]);

    const proteinMatch = raw.match(/protein(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (proteinMatch) nutrition.protein = parseFloat(proteinMatch[1]);

    const carbsMatch = raw.match(/(?:carbohydrate|carbs)s?(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (carbsMatch) nutrition.carbohydrates = parseFloat(carbsMatch[1]);

    const sugarMatch = raw.match(/(?:total\s+)?sugar(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (sugarMatch) nutrition.sugar = parseFloat(sugarMatch[1]);

    const addedSugarMatch = raw.match(/added\s+sugar(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (addedSugarMatch) nutrition.addedSugar = parseFloat(addedSugarMatch[1]);

    const fatMatch = raw.match(/(?:total\s+)?fat(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (fatMatch) nutrition.fat = parseFloat(fatMatch[1]);

    const satFatMatch = raw.match(/saturated\s+fat(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (satFatMatch) nutrition.saturatedFat = parseFloat(satFatMatch[1]);

    const transFatMatch = raw.match(/trans\s+fat(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (transFatMatch) nutrition.transFat = parseFloat(transFatMatch[1]);

    const fiberMatch = raw.match(/(?:dietary\s+)?fib(?:er|re)(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (fiberMatch) nutrition.fiber = parseFloat(fiberMatch[1]);

    const sodiumMatch = raw.match(/sodium(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*(?:mg)?/i);
    if (sodiumMatch) nutrition.sodium = parseFloat(sodiumMatch[1]);

    // 12. Ingredients text
    let ingredientsText: string | undefined;
    const ingSection = raw.match(/ingredients?\s*[\:\-]([\s\S]+?)(?=\.\s*(?:allergen|nutrition|mfd|mfg|best|net|mrp|$))/i);
    if (ingSection) {
      ingredientsText = ingSection[1].replace(/\n/g, ' ').trim();
    } else {
      const ingLine = lines.find((l) => /^ingredients?[\s\:\-]/i.test(l));
      if (ingLine) {
        ingredientsText = ingLine.replace(/^ingredients?[\s\:\-]+/i, '').trim();
      }
    }

    // 13. Allergens
    const allergens: string[] = [];
    const allergenMatch = raw.match(/(?:contains|allergens?|may\s+contain)[\s\:\-]+([^\.\n]+)/i);
    if (allergenMatch) {
      const parts = allergenMatch[1].split(/,|\band\b/i).map((s) => s.trim());
      allergens.push(...parts.filter((p) => p.length > 1 && p.length < 30));
    }

    return {
      rawText: raw,
      barcode,
      name,
      brand,
      variant,
      commodityName,
      productName: name,
      manufacturer,
      manufacturerAddress,
      packer,
      packerAddress,
      importer,
      importerAddress,
      netQuantity,
      packSize,
      count,
      mrp,
      price,
      mrpNumeric: price,
      currency: 'INR',
      allMrpValues: allMrpValues.length > 0 ? allMrpValues : mrp ? [mrp] : [],
      multipleMrpDetected,
      unitSalePrice,
      fssaiNumber,
      manufacturingDate,
      packingDate,
      importDate,
      normalizedDate,
      expiryDate,
      bestBefore,
      consumerCarePhone,
      consumerCareEmail,
      consumerCareAddress,
      countryOfOrigin,
      dimensions,
      ocrConfidenceScores: confidenceScores,
      noiseCandidates,
      ingredientsText: ingredientsText || undefined,
      allergens: Array.from(new Set(allergens)),
      nutrition: Object.keys(nutrition).length > 1 ? nutrition : undefined
    };
  }
}
