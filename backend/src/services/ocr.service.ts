import { createWorker } from 'tesseract.js';
import { StandardNutrition, StandardIngredient } from '../types';

export interface ExtractedProductFields {
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
    "Slurrp Farm", "Yoga Bar", "RiteBite", "MyFitness", "Bagrry's", "Sundrop"
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
   */
  public static parsePackageText(text: string): ExtractedProductFields {
    const raw = text.replace(/\r/g, '\n');
    const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 1);

    // 1. Check for barcode / GTIN digits (12 to 14 consecutive digits, often starting with 890 for India)
    let barcode: string | undefined;
    const barcodeMatch = raw.match(/\b(890\d{10})\b/) || raw.match(/\b(\d{13})\b/) || raw.match(/\b(\d{12})\b/);
    if (barcodeMatch) {
      barcode = barcodeMatch[1];
    }

    // 2. FSSAI 14-digit license number
    let fssaiNumber: string | undefined;
    const fssaiMatch = raw.match(/(?:fssai|lic(?:\.|\s*no)?)[\s\:\-]+(\d{14})/i) || raw.match(/\b(100\d{11}|200\d{11})\b/);
    if (fssaiMatch) {
      fssaiNumber = fssaiMatch[1];
    }

    // 3. Brand detection (Known brand dictionary or prominent top text)
    let brand: string | undefined;
    let name: string | undefined;
    let variant: string | undefined;

    for (const b of this.knownBrands) {
      const regex = new RegExp(`\\b${b.replace("'", "['’]?")}\\b`, 'i');
      if (regex.test(raw)) {
        brand = b;
        break;
      }
    }

    // Heuristics for product name & variant
    if (lines.length > 0) {
      // Find the first line that is not just dates or numbers
      const titleLines = lines.filter(
        (l) => !l.match(/^(fssai|lic|mrp|mfd|exp|net|batch|pkd|use|date)/i) && l.length > 2 && l.length < 60
      );

      if (titleLines.length > 0) {
        name = titleLines.slice(0, 2).join(' ');
        if (!brand) {
          brand = titleLines[0].split(' ')[0];
        }
      }
    }

    // Flavor / Variant detection (e.g. Classic Salted, Magic Masala, Cream & Onion)
    const variantMatch = raw.match(/\b(Classic Salted|Magic Masala|American Style Cream|Spanish Tomato|Hot.*Sweet|Dark Fantasy|Milk Chocolate|Almond|Crunchy|Masala Noodles|Double Rich Chocolate)\b/i);
    if (variantMatch) {
      variant = variantMatch[1];
    }

    // 4. Nutrition fields
    const nutrition: StandardNutrition = {
      servingSize: '100g'
    };

    // Calories: e.g. "Energy 544 kcal" or "Calories: 220"
    const energyMatch = raw.match(/(?:energy|calories|kcal)[\s\:\-]+(\d+(?:\.\d+)?)\s*(?:kcal)?/i);
    if (energyMatch) {
      nutrition.calories = parseFloat(energyMatch[1]);
    }

    // Protein:
    const proteinMatch = raw.match(/protein(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (proteinMatch) {
      nutrition.protein = parseFloat(proteinMatch[1]);
    }

    // Carbohydrates:
    const carbsMatch = raw.match(/(?:carbohydrate|carbs)s?(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (carbsMatch) {
      nutrition.carbohydrates = parseFloat(carbsMatch[1]);
    }

    // Sugar:
    const sugarMatch = raw.match(/(?:total\s+)?sugar(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (sugarMatch) {
      nutrition.sugar = parseFloat(sugarMatch[1]);
    }

    // Added sugar:
    const addedSugarMatch = raw.match(/added\s+sugar(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (addedSugarMatch) {
      nutrition.addedSugar = parseFloat(addedSugarMatch[1]);
    }

    // Fat:
    const fatMatch = raw.match(/(?:total\s+)?fat(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (fatMatch) {
      nutrition.fat = parseFloat(fatMatch[1]);
    }

    // Saturated fat:
    const satFatMatch = raw.match(/saturated\s+fat(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (satFatMatch) {
      nutrition.saturatedFat = parseFloat(satFatMatch[1]);
    }

    // Trans fat:
    const transFatMatch = raw.match(/trans\s+fat(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (transFatMatch) {
      nutrition.transFat = parseFloat(transFatMatch[1]);
    }

    // Dietary Fiber:
    const fiberMatch = raw.match(/(?:dietary\s+)?fib(?:er|re)(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*g?/i);
    if (fiberMatch) {
      nutrition.fiber = parseFloat(fiberMatch[1]);
    }

    // Sodium:
    const sodiumMatch = raw.match(/sodium(?:\s*\([^\)]*\))?[\s\:\-]+(\d+(?:\.\d+)?)\s*(?:mg)?/i);
    if (sodiumMatch) {
      nutrition.sodium = parseFloat(sodiumMatch[1]);
    }

    // 5. Ingredients text
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

    // 6. Allergens
    const allergens: string[] = [];
    const allergenMatch = raw.match(/(?:contains|allergens?|may\s+contain)[\s\:\-]+([^\.\n]+)/i);
    if (allergenMatch) {
      const parts = allergenMatch[1].split(/,|\band\b/i).map((s) => s.trim());
      allergens.push(...parts.filter((p) => p.length > 1 && p.length < 30));
    }

    // 7. MRP / Price
    let price: number | undefined;
    let mrp: string | undefined;
    const mrpMatch = raw.match(/(?:mrp|rs\.?|₹|inr)[\s\:\.]*(\d+(?:\.\d{1,2})?)/i);
    if (mrpMatch) {
      price = parseFloat(mrpMatch[1]);
      mrp = `₹${mrpMatch[1]}`;
    }

    // 8. Pack Size
    let packSize: string | undefined;
    const netQtyMatch = raw.match(/(?:net\s*(?:wt\.?|weight|qty|quantity)?)[\s\:\-]+(\d+(?:\.\d+)?\s*(?:g|kg|ml|l))/i);
    if (netQtyMatch) {
      packSize = netQtyMatch[1].replace(/\s+/g, '');
    }

    // 9. Dates
    const mfgMatch = raw.match(/(?:mfg|mfd|pkd|manufactured)[\s\:\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    const manufacturingDate = mfgMatch ? mfgMatch[1] : undefined;

    const expMatch = raw.match(/(?:exp|expiry|use\s*by)[\s\:\.]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
    const expiryDate = expMatch ? expMatch[1] : undefined;

    const bbMatch = raw.match(/best\s*before[\s\:\.]*([^\n\.]+)/i);
    const bestBefore = bbMatch ? bbMatch[1].trim() : undefined;

    return {
      rawText: raw,
      barcode,
      name,
      brand,
      variant,
      fssaiNumber,
      price,
      mrp,
      packSize,
      manufacturingDate,
      expiryDate,
      bestBefore,
      ingredientsText: ingredientsText || undefined,
      allergens: Array.from(new Set(allergens)),
      nutrition: Object.keys(nutrition).length > 1 ? nutrition : undefined
    };
  }
}
