import {
  LegalMetrologyCheckItem,
  LegalMetrologySummary,
  MPEResult,
  LegalMetrologyExtractedFields,
  LegalMetrologyComplianceResult
} from '../types';
import {
  LEGAL_METROLOGY_RULES_2011,
  STANDARD_LEGAL_METROLOGY_DISCLAIMER
} from './legalMetrologyRules';

export class LegalMetrologyComplianceEngine {
  /**
   * Calculates the Maximum Permissible Error (MPE) on net quantity
   * based on the First Schedule of the Legal Metrology (Packaged Commodities) Rules, 2011.
   */
  public static calculateMPE(quantity: number, unit: string, commodity?: string): MPEResult {
    const cleanUnit = (unit || '').toLowerCase().trim();
    let normalizedQty = quantity;
    let baseUnit = cleanUnit;

    // Convert kg to g and l to ml for standardized lookup
    if (cleanUnit === 'kg') {
      normalizedQty = quantity * 1000;
      baseUnit = 'g';
    } else if (cleanUnit === 'l' || cleanUnit === 'litre' || cleanUnit === 'liter') {
      normalizedQty = quantity * 1000;
      baseUnit = 'ml';
    }

    // Number / count check
    if (['n', 'u', 'units', 'pieces', 'pcs', 'count', 'items'].includes(cleanUnit)) {
      let permissibleErr = 0;
      let exp = 'For commodities sold by number: up to 10 units, error is Nil; over 10 units, permissible error is 1 item or 2%.';
      if (quantity <= 10) {
        permissibleErr = 0;
      } else if (quantity <= 50) {
        permissibleErr = 1;
      } else {
        permissibleErr = Math.ceil(quantity * 0.02);
      }

      return {
        declaredQuantity: quantity,
        declaredUnit: unit,
        permissibleError: permissibleErr,
        errorUnit: 'N',
        minAcceptableQuantity: Math.max(0, quantity - permissibleErr),
        maxAcceptableQuantity: quantity + permissibleErr,
        scheduleReference: 'First Schedule, Table 2 (Commodities sold by number)',
        status: 'PASS',
        explanation: exp
      };
    }

    // Mass (g) or Volume (ml) MPE calculation
    let permissibleError = 0;
    let explanation = '';

    if (normalizedQty <= 50) {
      permissibleError = normalizedQty * 0.09;
      explanation = '9% of declared quantity for packs up to 50g / 50ml.';
    } else if (normalizedQty <= 100) {
      permissibleError = 4.5;
      explanation = '4.5g / 4.5ml fixed permissible error for packs from 50g to 100g.';
    } else if (normalizedQty <= 200) {
      permissibleError = normalizedQty * 0.045;
      explanation = '4.5% of declared quantity for packs from 100g to 200g.';
    } else if (normalizedQty <= 300) {
      permissibleError = 9.0;
      explanation = '9.0g / 9.0ml fixed permissible error for packs from 200g to 300g.';
    } else if (normalizedQty <= 500) {
      permissibleError = normalizedQty * 0.03;
      explanation = '3% of declared quantity for packs from 300g to 500g.';
    } else if (normalizedQty <= 1000) {
      permissibleError = 15.0;
      explanation = '15g / 15ml fixed permissible error for packs from 500g to 1000g (1kg).';
    } else if (normalizedQty <= 10000) {
      permissibleError = normalizedQty * 0.015;
      explanation = '1.5% of declared quantity for packs from 1kg to 10kg.';
    } else if (normalizedQty <= 15000) {
      permissibleError = 150.0;
      explanation = '150g / 150ml fixed permissible error for packs from 10kg to 15kg.';
    } else {
      permissibleError = normalizedQty * 0.01;
      explanation = '1.0% of declared quantity for packs above 15kg.';
    }

    permissibleError = Math.round(permissibleError * 100) / 100;

    // Convert back to declared unit if necessary for display
    let displayError = permissibleError;
    let displayErrorUnit = baseUnit;

    if (cleanUnit === 'kg' || cleanUnit === 'l' || cleanUnit === 'litre') {
      displayError = permissibleError / 1000;
      displayErrorUnit = cleanUnit;
    }

    return {
      declaredQuantity: quantity,
      declaredUnit: unit,
      permissibleError: displayError,
      errorUnit: displayErrorUnit,
      minAcceptableQuantity: Math.round((quantity - displayError) * 1000) / 1000,
      maxAcceptableQuantity: Math.round((quantity + displayError) * 1000) / 1000,
      scheduleReference: 'First Schedule of Legal Metrology (Packaged Commodities) Rules, 2011',
      status: 'PASS',
      explanation
    };
  }

  /**
   * Normalizes and validates net quantity text.
   * Retains both original and normalized values.
   */
  public static normalizeNetQuantity(rawText?: string): {
    originalValue: string;
    normalizedValue: string;
    quantity: number;
    unit: string;
    isValid: boolean;
    isMisleading: boolean;
    misleadingReason?: string;
    candidateSuggestion?: string;
    confidence: number;
  } {
    if (!rawText || !rawText.trim()) {
      return {
        originalValue: '',
        normalizedValue: '',
        quantity: 0,
        unit: '',
        isValid: false,
        isMisleading: false,
        confidence: 0
      };
    }

    const trimmed = rawText.trim();

    // Check for prohibited / misleading qualifiers
    const misleadingRegex = /\b(approx(?:imately)?|about|minimum|not\s+less\s+than|when\s+packed)\b/i;
    const isMisleading = misleadingRegex.test(trimmed);
    const misleadingReason = isMisleading
      ? `Prohibited qualifier detected ("${trimmed.match(misleadingRegex)![0]}"). Net quantity must be unambiguous under Rule 11.`
      : undefined;

    // Check for OCR noise candidate: e.g. "500 9" or "5009" -> candidate "500 g"
    let candidateSuggestion: string | undefined;
    let confidence = 0.95;

    const noiseMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*9$/);
    if (noiseMatch) {
      candidateSuggestion = `${noiseMatch[1]} g`;
      confidence = 0.71;
    }

    // Standard quantity regex match: e.g. "500 g", "1 kg", "250 ml", "1 L", "10 N"
    const match = trimmed.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (!match) {
      return {
        originalValue: trimmed,
        normalizedValue: trimmed,
        quantity: 0,
        unit: '',
        isValid: false,
        isMisleading,
        misleadingReason,
        candidateSuggestion,
        confidence: candidateSuggestion ? 0.7 : 0.2
      };
    }

    const numericVal = parseFloat(match[1]);
    const rawUnit = match[2];
    const cleanUnit = rawUnit.toLowerCase();

    // Standard SI / Legal units check
    const validUnits = ['g', 'gm', 'gms', 'kg', 'ml', 'l', 'ltr', 'litre', 'liter', 'mg', 'n', 'u', 'pcs', 'pieces', 'units'];
    const isValidUnit = validUnits.includes(cleanUnit);

    let normalizedUnit = cleanUnit;
    let normalizedVal = numericVal;

    if (cleanUnit === 'gm' || cleanUnit === 'gms') normalizedUnit = 'g';
    if (cleanUnit === 'ltr' || cleanUnit === 'liter' || cleanUnit === 'litre') normalizedUnit = 'L';
    if (cleanUnit === 'l') normalizedUnit = 'L';

    // Normalization to base grams / ml
    if (cleanUnit === 'kg') {
      normalizedVal = numericVal * 1000;
      normalizedUnit = 'g';
    } else if (cleanUnit === 'l' || cleanUnit === 'litre' || cleanUnit === 'ltr') {
      normalizedVal = numericVal * 1000;
      normalizedUnit = 'ml';
    }

    const normalizedDisplay = `${normalizedVal} ${normalizedUnit}`;

    return {
      originalValue: trimmed,
      normalizedValue: normalizedDisplay,
      quantity: numericVal,
      unit: rawUnit,
      isValid: isValidUnit && !isMisleading,
      isMisleading,
      misleadingReason,
      candidateSuggestion,
      confidence: candidateSuggestion ? 0.71 : isValidUnit ? 0.95 : 0.6
    };
  }

  /**
   * Evaluates extracted package declarations against Legal Metrology (Packaged Commodities) Rules, 2011.
   */
  public static evaluateProduct(data: Partial<LegalMetrologyExtractedFields>): LegalMetrologyComplianceResult {
    const checks: LegalMetrologyCheckItem[] = [];
    const warnings: string[] = [];
    const exemptions: string[] = [];

    // --- 0. Check Exemptions (Rule 3 & Rule 26) ---
    let isExemptWholesale = false;
    let isExemptSmallPack = false;

    // Check quantity for wholesale threshold (> 25kg or 25L)
    const qtyCheck = this.normalizeNetQuantity(data.netQuantity);
    if (qtyCheck.isValid) {
      if (qtyCheck.normalizedValue.endsWith('g') && qtyCheck.quantity >= 25000) {
        isExemptWholesale = true;
      } else if (qtyCheck.normalizedValue.endsWith('ml') && qtyCheck.quantity >= 25000) {
        isExemptWholesale = true;
      } else if (qtyCheck.unit.toLowerCase() === 'kg' && qtyCheck.quantity > 25) {
        isExemptWholesale = true;
      } else if (qtyCheck.unit.toLowerCase() === 'l' && qtyCheck.quantity > 25) {
        isExemptWholesale = true;
      }

      // Check small pack exemption (< 10g or 10ml)
      if (
        (qtyCheck.normalizedValue.endsWith('g') && qtyCheck.quantity <= 10) ||
        (qtyCheck.normalizedValue.endsWith('ml') && qtyCheck.quantity <= 10)
      ) {
        isExemptSmallPack = true;
      }
    }

    if (isExemptWholesale) {
      exemptions.push('Rule 26(a) Exemption: Package exceeds 25 kg / 25 L threshold for retail packaged commodity provisions.');
    }
    if (isExemptSmallPack) {
      exemptions.push('Rule 26(c) Exemption: Small package (net quantity <= 10g / 10ml) exempt from certain retail display requirements.');
    }

    // --- Check 1: Rule 6(1)(b) Commodity Name ---
    const commodityVal = data.commodityName || data.productName;
    const commodityConf = data.ocrConfidenceScores?.commodityName ?? (commodityVal ? 0.92 : 0.1);

    if (commodityVal && commodityVal.trim().length > 1) {
      checks.push({
        ruleId: 'LM-001',
        ruleCode: 'RULE_6_1_B',
        requirement: 'Commodity Name',
        status: 'PASS',
        detectedValue: commodityVal,
        originalValue: commodityVal,
        normalizedValue: commodityVal,
        reason: `Common/generic commodity name detected: "${commodityVal}".`,
        ocrConfidence: commodityConf,
        confidenceLabel: commodityConf >= 0.85 ? 'HIGH' : commodityConf >= 0.5 ? 'MODERATE' : 'LOW',
        mandatory: true,
        legalReference: 'Rule 6(1)(b) of LM (PC) Rules, 2011'
      });
    } else {
      checks.push({
        ruleId: 'LM-001',
        ruleCode: 'RULE_6_1_B',
        requirement: 'Commodity Name',
        status: 'FAIL',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Common/generic name of the commodity could not be detected on the package.',
        ocrConfidence: 0.1,
        confidenceLabel: 'NOT_DETECTED',
        mandatory: true,
        legalReference: 'Rule 6(1)(b) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 2: Rule 6(1)(a) & (ab) Manufacturer / Packer / Importer ---
    // Do NOT require all three simultaneously!
    const mfgName = data.manufacturer;
    const mfgAddr = data.manufacturerAddress;
    const pkrName = data.packer;
    const pkrAddr = data.packerAddress;
    const impName = data.importer;
    const impAddr = data.importerAddress;

    let entityType: 'MANUFACTURER' | 'PACKER' | 'IMPORTER' | 'NONE' = 'NONE';
    let entityName = '';
    let entityAddress = '';

    if (impName || impAddr) {
      entityType = 'IMPORTER';
      entityName = impName || 'Imported Entity';
      entityAddress = impAddr || '';
    } else if (mfgName || mfgAddr) {
      entityType = 'MANUFACTURER';
      entityName = mfgName || 'Manufacturer';
      entityAddress = mfgAddr || '';
    } else if (pkrName || pkrAddr) {
      entityType = 'PACKER';
      entityName = pkrName || 'Packer';
      entityAddress = pkrAddr || '';
    }

    const mfgConf = data.ocrConfidenceScores?.manufacturer ?? (entityType !== 'NONE' ? 0.9 : 0.1);

    if (entityType !== 'NONE') {
      const detectedSummary = entityAddress ? `${entityName} (${entityAddress})` : entityName;
      checks.push({
        ruleId: 'LM-002',
        ruleCode: 'RULE_6_1_A',
        requirement: 'Manufacturer / Packer / Importer',
        status: 'PASS',
        detectedValue: detectedSummary,
        originalValue: detectedSummary,
        normalizedValue: detectedSummary,
        reason: `${entityType} declaration detected. Name and address verified under Rule 6(1)(a).`,
        ocrConfidence: mfgConf,
        confidenceLabel: mfgConf >= 0.85 ? 'HIGH' : mfgConf >= 0.5 ? 'MODERATE' : 'LOW',
        mandatory: true,
        legalReference: 'Rule 6(1)(a) & (ab) of LM (PC) Rules, 2011'
      });
    } else {
      checks.push({
        ruleId: 'LM-002',
        ruleCode: 'RULE_6_1_A',
        requirement: 'Manufacturer / Packer / Importer',
        status: 'FAIL',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Required manufacturer, packer, or importer name/address declaration could not be detected.',
        ocrConfidence: 0.1,
        confidenceLabel: 'NOT_DETECTED',
        mandatory: true,
        legalReference: 'Rule 6(1)(a) & (ab) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 3: Rule 6(1)(c) Net Quantity & Unit Validation ---
    let mpeResult: MPEResult | null = null;
    const rawNetQty = data.netQuantity;
    const netQtyParsed = this.normalizeNetQuantity(rawNetQty);

    if (isExemptWholesale) {
      checks.push({
        ruleId: 'LM-003',
        ruleCode: 'RULE_6_1_C',
        requirement: 'Net Quantity',
        status: 'NOT_APPLICABLE',
        detectedValue: rawNetQty || 'Exempt',
        originalValue: rawNetQty || null,
        normalizedValue: netQtyParsed.normalizedValue || null,
        reason: 'Wholesale package (> 25kg/L) exempt from standard retail net quantity declaration under Rule 26(a).',
        ocrConfidence: 0.95,
        confidenceLabel: 'HIGH',
        mandatory: false,
        legalReference: 'Rule 6(1)(c) & Rule 26(a) of LM (PC) Rules, 2011'
      });
    } else if (netQtyParsed.isMisleading) {
      checks.push({
        ruleId: 'LM-003',
        ruleCode: 'RULE_6_1_C',
        requirement: 'Net Quantity',
        status: 'FAIL',
        detectedValue: rawNetQty,
        originalValue: rawNetQty,
        normalizedValue: netQtyParsed.normalizedValue,
        reason: netQtyParsed.misleadingReason || 'Misleading quantity declaration detected.',
        ocrConfidence: netQtyParsed.confidence,
        confidenceLabel: 'HIGH',
        mandatory: true,
        legalReference: 'Rule 6(1)(c) & Rule 11 of LM (PC) Rules, 2011'
      });
      warnings.push(`Illegal qualifier in net quantity: "${rawNetQty}". Under Rule 11, quantity must not be qualified by approximate terms.`);
    } else if (netQtyParsed.candidateSuggestion) {
      // OCR noise candidate detected (e.g. "500 9" -> candidate "500 g")
      checks.push({
        ruleId: 'LM-003',
        ruleCode: 'RULE_6_1_C',
        requirement: 'Net Quantity',
        status: 'REVIEW',
        detectedValue: rawNetQty,
        originalValue: rawNetQty,
        normalizedValue: netQtyParsed.candidateSuggestion,
        candidateSuggestion: netQtyParsed.candidateSuggestion,
        reason: `OCR read "${rawNetQty}" which may be an artifact for "${netQtyParsed.candidateSuggestion}". Manual inspection required.`,
        ocrConfidence: netQtyParsed.confidence,
        confidenceLabel: 'MODERATE',
        mandatory: true,
        legalReference: 'Rule 6(1)(c) of LM (PC) Rules, 2011'
      });
      warnings.push(`OCR ambiguity on net quantity: "${rawNetQty}". Candidate interpretation: "${netQtyParsed.candidateSuggestion}".`);
      mpeResult = this.calculateMPE(netQtyParsed.quantity, 'g');
    } else if (netQtyParsed.isValid) {
      mpeResult = this.calculateMPE(netQtyParsed.quantity, netQtyParsed.unit);
      checks.push({
        ruleId: 'LM-003',
        ruleCode: 'RULE_6_1_C',
        requirement: 'Net Quantity',
        status: 'PASS',
        detectedValue: rawNetQty,
        originalValue: rawNetQty,
        normalizedValue: netQtyParsed.normalizedValue,
        reason: `Net quantity declaration detected and valid: ${rawNetQty} (Standardized: ${netQtyParsed.normalizedValue}).`,
        ocrConfidence: netQtyParsed.confidence,
        confidenceLabel: 'HIGH',
        mandatory: true,
        legalReference: 'Rule 6(1)(c) & Rules 11, 12, 13 of LM (PC) Rules, 2011'
      });
    } else {
      checks.push({
        ruleId: 'LM-003',
        ruleCode: 'RULE_6_1_C',
        requirement: 'Net Quantity',
        status: 'FAIL',
        detectedValue: rawNetQty || null,
        originalValue: rawNetQty || null,
        normalizedValue: null,
        reason: rawNetQty
          ? `Net quantity "${rawNetQty}" does not conform to prescribed legal measurement units.`
          : 'Net quantity declaration could not be detected on the package.',
        ocrConfidence: rawNetQty ? 0.4 : 0.1,
        confidenceLabel: rawNetQty ? 'LOW' : 'NOT_DETECTED',
        mandatory: true,
        legalReference: 'Rule 6(1)(c) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 4: Rule 6(1)(e) Maximum Retail Price (MRP) ---
    const mrpRaw = data.mrp;
    const mrpNum = data.mrpNumeric;
    const mrpConf = data.ocrConfidenceScores?.mrp ?? (mrpRaw ? 0.94 : 0.1);

    if (isExemptWholesale) {
      checks.push({
        ruleId: 'LM-004',
        ruleCode: 'RULE_6_1_E',
        requirement: 'Maximum Retail Price (MRP)',
        status: 'NOT_APPLICABLE',
        detectedValue: mrpRaw || 'Exempt',
        originalValue: mrpRaw || null,
        normalizedValue: mrpRaw || null,
        reason: 'Wholesale package exempt from consumer Maximum Retail Price declaration under Rule 26(a).',
        ocrConfidence: 0.95,
        confidenceLabel: 'HIGH',
        mandatory: false,
        legalReference: 'Rule 6(1)(e) & Rule 26(a) of LM (PC) Rules, 2011'
      });
    } else if (data.multipleMrpDetected) {
      checks.push({
        ruleId: 'LM-004',
        ruleCode: 'RULE_6_1_E',
        requirement: 'Maximum Retail Price (MRP)',
        status: 'REVIEW',
        detectedValue: data.allMrpValues ? data.allMrpValues.join(' vs ') : mrpRaw,
        originalValue: mrpRaw,
        normalizedValue: mrpNum ? `₹${mrpNum}` : mrpRaw,
        reason: 'Multiple conflicting MRP values detected on package label. Manual verification required to rule out dual MRP violation.',
        ocrConfidence: 0.65,
        confidenceLabel: 'MODERATE',
        mandatory: true,
        legalReference: 'Rule 6(1)(e) of LM (PC) Rules, 2011 & Dual Pricing Prohibition'
      });
      warnings.push('WARNING: Multiple conflicting MRP values detected on package label. Dual MRP is prohibited under Legal Metrology Rules.');
    } else if (mrpRaw && (mrpNum !== undefined && mrpNum > 0 || /₹|rs\.?|inr/i.test(mrpRaw))) {
      const normalizedMrp = mrpNum !== undefined ? `₹${mrpNum}` : mrpRaw.replace(/^rs\.?/i, '₹');
      checks.push({
        ruleId: 'LM-004',
        ruleCode: 'RULE_6_1_E',
        requirement: 'Maximum Retail Price (MRP)',
        status: 'PASS',
        detectedValue: mrpRaw,
        originalValue: mrpRaw,
        normalizedValue: normalizedMrp,
        reason: `MRP declaration detected: ${mrpRaw} (inclusive of all taxes).`,
        ocrConfidence: mrpConf,
        confidenceLabel: mrpConf >= 0.85 ? 'HIGH' : mrpConf >= 0.5 ? 'MODERATE' : 'LOW',
        mandatory: true,
        legalReference: 'Rule 6(1)(e) of LM (PC) Rules, 2011'
      });
    } else if (mrpRaw && mrpConf < 0.6) {
      checks.push({
        ruleId: 'LM-004',
        ruleCode: 'RULE_6_1_E',
        requirement: 'Maximum Retail Price (MRP)',
        status: 'REVIEW',
        detectedValue: mrpRaw,
        originalValue: mrpRaw,
        normalizedValue: mrpRaw,
        reason: `MRP text detected ("${mrpRaw}") but OCR confidence is low. Manual verification recommended.`,
        ocrConfidence: mrpConf,
        confidenceLabel: 'LOW',
        mandatory: true,
        legalReference: 'Rule 6(1)(e) of LM (PC) Rules, 2011'
      });
    } else {
      checks.push({
        ruleId: 'LM-004',
        ruleCode: 'RULE_6_1_E',
        requirement: 'Maximum Retail Price (MRP)',
        status: 'FAIL',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Maximum Retail Price (MRP) declaration could not be detected on the package.',
        ocrConfidence: 0.1,
        confidenceLabel: 'NOT_DETECTED',
        mandatory: true,
        legalReference: 'Rule 6(1)(e) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 5: Rule 6(1)(d) Month and Year of Manufacture / Packing / Import ---
    // Do NOT require all three simultaneously!
    const mfd = data.manufacturingDate;
    const pkd = data.packingDate;
    const impDate = data.importDate;
    const dateDetected = mfd || pkd || impDate || data.normalizedDate;

    const dateConf = data.ocrConfidenceScores?.date ?? (dateDetected ? 0.9 : 0.1);

    if (dateDetected) {
      let dateType = 'Manufacture (MFD)';
      if (pkd) dateType = 'Packing (PKD)';
      if (impDate) dateType = 'Import';

      checks.push({
        ruleId: 'LM-005',
        ruleCode: 'RULE_6_1_D',
        requirement: 'Date Declaration (MFD / PKD / IMP)',
        status: 'PASS',
        detectedValue: dateDetected,
        originalValue: dateDetected,
        normalizedValue: data.normalizedDate || dateDetected,
        reason: `Date of ${dateType} detected: ${dateDetected}.`,
        ocrConfidence: dateConf,
        confidenceLabel: dateConf >= 0.85 ? 'HIGH' : dateConf >= 0.5 ? 'MODERATE' : 'LOW',
        mandatory: true,
        legalReference: 'Rule 6(1)(d) of LM (PC) Rules, 2011'
      });
    } else {
      checks.push({
        ruleId: 'LM-005',
        ruleCode: 'RULE_6_1_D',
        requirement: 'Date Declaration (MFD / PKD / IMP)',
        status: 'FAIL',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Required month and year of manufacture, packing, or import could not be detected.',
        ocrConfidence: 0.1,
        confidenceLabel: 'NOT_DETECTED',
        mandatory: true,
        legalReference: 'Rule 6(1)(d) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 6: Rule 6(1)(n) Consumer Care Details ---
    const phone = data.consumerCarePhone;
    const email = data.consumerCareEmail;
    const careAddr = data.consumerCareAddress;
    const hasCare = Boolean(phone || email || careAddr);
    const careConf = data.ocrConfidenceScores?.consumerCare ?? (hasCare ? 0.88 : 0.1);

    if (hasCare) {
      const details = [phone, email, careAddr].filter(Boolean).join(' | ');
      checks.push({
        ruleId: 'LM-006',
        ruleCode: 'RULE_6_1_N',
        requirement: 'Consumer Care Details',
        status: 'PASS',
        detectedValue: details,
        originalValue: details,
        normalizedValue: details,
        reason: 'Consumer care / complaint contact information detected under Rule 6(1)(n).',
        ocrConfidence: careConf,
        confidenceLabel: careConf >= 0.85 ? 'HIGH' : 'MODERATE',
        mandatory: true,
        legalReference: 'Rule 6(1)(n) of LM (PC) Rules, 2011'
      });
    } else {
      checks.push({
        ruleId: 'LM-006',
        ruleCode: 'RULE_6_1_N',
        requirement: 'Consumer Care Details',
        status: 'FAIL',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Consumer care / complaint helpline, email, or redressal address could not be detected.',
        ocrConfidence: 0.1,
        confidenceLabel: 'NOT_DETECTED',
        mandatory: true,
        legalReference: 'Rule 6(1)(n) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 7: Rule 6(1)(aa) Country of Origin ---
    const origin = data.countryOfOrigin;
    const isImported = Boolean(impName || (origin && !/india/i.test(origin)));

    if (isImported) {
      if (origin) {
        checks.push({
          ruleId: 'LM-007',
          ruleCode: 'RULE_6_1_AA',
          requirement: 'Country of Origin',
          status: 'PASS',
          detectedValue: origin,
          originalValue: origin,
          normalizedValue: origin,
          reason: `Country of origin detected for imported package: "${origin}".`,
          ocrConfidence: 0.92,
          confidenceLabel: 'HIGH',
          mandatory: true,
          legalReference: 'Rule 6(1)(aa) of LM (PC) Rules, 2011'
        });
      } else {
        checks.push({
          ruleId: 'LM-007',
          ruleCode: 'RULE_6_1_AA',
          requirement: 'Country of Origin',
          status: 'FAIL',
          detectedValue: null,
          originalValue: null,
          normalizedValue: null,
          reason: 'Imported package identified but Country of Origin is missing.',
          ocrConfidence: 0.1,
          confidenceLabel: 'NOT_DETECTED',
          mandatory: true,
          legalReference: 'Rule 6(1)(aa) of LM (PC) Rules, 2011'
        });
      }
    } else {
      // Domestic / default Indian commodity: origin is either stated or not required for domestic single-source
      checks.push({
        ruleId: 'LM-007',
        ruleCode: 'RULE_6_1_AA',
        requirement: 'Country of Origin',
        status: 'PASS',
        detectedValue: origin || 'India (Domestic)',
        originalValue: origin || 'India',
        normalizedValue: 'India',
        reason: origin ? `Country of origin declared: ${origin}.` : 'Domestic commodity produced in India.',
        ocrConfidence: origin ? 0.9 : 0.8,
        confidenceLabel: 'HIGH',
        mandatory: false,
        legalReference: 'Rule 6(1)(aa) of LM (PC) Rules, 2011'
      });
    }

    // --- Check 8: Rule 6(1)(e) Unit Sale Price (USP) ---
    // Mandatory for packages > 100g / 100ml
    const usp = data.unitSalePrice;
    const isLargePack = netQtyParsed.isValid && (
      (netQtyParsed.normalizedValue.endsWith('g') && netQtyParsed.quantity > 100) ||
      (netQtyParsed.normalizedValue.endsWith('ml') && netQtyParsed.quantity > 100)
    );

    if (usp) {
      checks.push({
        ruleId: 'LM-008',
        ruleCode: 'RULE_6_1_E_USP',
        requirement: 'Unit Sale Price (USP)',
        status: 'PASS',
        detectedValue: usp,
        originalValue: usp,
        normalizedValue: usp,
        reason: `Unit Sale Price (USP) declared: ${usp}.`,
        ocrConfidence: 0.88,
        confidenceLabel: 'HIGH',
        mandatory: isLargePack,
        legalReference: 'Rule 6(1)(e) Amendment of LM (PC) Rules'
      });
    } else if (isLargePack) {
      checks.push({
        ruleId: 'LM-008',
        ruleCode: 'RULE_6_1_E_USP',
        requirement: 'Unit Sale Price (USP)',
        status: 'REVIEW',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Package exceeds 100g/100ml. Unit Sale Price (e.g. ₹/g or ₹/ml) should be verified on package label.',
        ocrConfidence: 0.5,
        confidenceLabel: 'LOW',
        mandatory: true,
        legalReference: 'Rule 6(1)(e) Amendment of LM (PC) Rules'
      });
    } else {
      checks.push({
        ruleId: 'LM-008',
        ruleCode: 'RULE_6_1_E_USP',
        requirement: 'Unit Sale Price (USP)',
        status: 'NOT_APPLICABLE',
        detectedValue: null,
        originalValue: null,
        normalizedValue: null,
        reason: 'Unit Sale Price is optional for packages of 100g/100ml or smaller.',
        ocrConfidence: 0.9,
        confidenceLabel: 'HIGH',
        mandatory: false,
        legalReference: 'Rule 6(1)(e) Amendment of LM (PC) Rules'
      });
    }

    // --- Compute Transparent Summary Metrics ---
    const mandatoryChecks = checks.filter((c) => c.mandatory && c.status !== 'NOT_APPLICABLE');
    const passed = checks.filter((c) => c.status === 'PASS').length;
    const failed = checks.filter((c) => c.status === 'FAIL').length;
    const review = checks.filter((c) => c.status === 'REVIEW').length;
    const notApplicable = checks.filter((c) => c.status === 'NOT_APPLICABLE').length;

    const summary: LegalMetrologySummary = {
      totalMandatory: mandatoryChecks.length,
      passed,
      failed,
      review,
      notApplicable
    };

    // --- Overall Status Determination ---
    // COMPLIANT: All mandatory checks pass, zero failures, zero reviews on mandatory fields
    // NON_COMPLIANT: Critical mandatory checks (MRP, Net Qty, Manufacturer, Commodity) fail, or direct violation
    // PARTIALLY_COMPLIANT: Some mandatory pass, but secondary mandatory items fail or review is required
    let overallStatus: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT' = 'COMPLIANT';

    const criticalRules = ['RULE_6_1_C', 'RULE_6_1_E', 'RULE_6_1_A'];
    const hasCriticalFailure = checks.some((c) => criticalRules.includes(c.ruleCode) && c.status === 'FAIL');

    if (hasCriticalFailure) {
      overallStatus = 'NON_COMPLIANT';
    } else if (failed > 0) {
      overallStatus = failed >= 2 ? 'NON_COMPLIANT' : 'PARTIALLY_COMPLIANT';
    } else if (review > 0) {
      overallStatus = 'PARTIALLY_COMPLIANT';
    } else {
      overallStatus = 'COMPLIANT';
    }

    return {
      overallStatus,
      summary,
      checks,
      mpe: mpeResult,
      extractedDeclarations: data as LegalMetrologyExtractedFields,
      warnings,
      exemptions,
      disclaimer: STANDARD_LEGAL_METROLOGY_DISCLAIMER
    };
  }
}
