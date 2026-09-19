import { describe, it, expect } from 'vitest';
import { LegalMetrologyComplianceEngine } from '../src/services/complianceEngine';
import { LegalMetrologyExtractedFields } from '../src/types';

describe('LegalMetrologyComplianceEngine', () => {
  // Test Case 1: All mandatory declarations present
  it('Test Case 1: should return COMPLIANT when all mandatory declarations are present', () => {
    const fullyCompliantProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Crunchy Potato Chips',
      commodityName: 'Potato Chips',
      brand: "Lay's",
      manufacturer: 'ABC Foods India Pvt Ltd',
      manufacturerAddress: 'Plot 45, Sector 8, Industrial Estate, Manesar, Gurugram, Haryana - 122050',
      netQuantity: '100 g',
      mrp: '₹50',
      mrpNumeric: 50,
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-222-3333',
      consumerCareEmail: 'feedback@abcfoods.com',
      consumerCareAddress: 'Customer Care Cell, ABC Foods India, Manesar, Haryana',
      countryOfOrigin: 'India'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(fullyCompliantProduct);

    expect(result.overallStatus).toBe('COMPLIANT');
    expect(result.summary.failed).toBe(0);
    expect(result.summary.passed).toBeGreaterThanOrEqual(6);

    // Verify individual checks
    const commCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_B');
    expect(commCheck?.status).toBe('PASS');

    const mfgCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_A');
    expect(mfgCheck?.status).toBe('PASS');

    const qtyCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_C');
    expect(qtyCheck?.status).toBe('PASS');

    const mrpCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_E');
    expect(mrpCheck?.status).toBe('PASS');

    const dateCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_D');
    expect(dateCheck?.status).toBe('PASS');

    const careCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_N');
    expect(careCheck?.status).toBe('PASS');
  });

  // Test Case 2: MRP missing
  it('Test Case 2: should return NON-COMPLIANT when MRP declaration is missing', () => {
    const missingMrpProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Crunchy Potato Chips',
      commodityName: 'Potato Chips',
      manufacturer: 'ABC Foods India Pvt Ltd',
      netQuantity: '100 g',
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-222-3333'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(missingMrpProduct);

    expect(result.overallStatus).toBe('NON_COMPLIANT');
    const mrpCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_E');
    expect(mrpCheck?.status).toBe('FAIL');
    expect(mrpCheck?.reason).toContain('Maximum Retail Price (MRP) declaration could not be detected');
  });

  // Test Case 3: Net quantity missing
  it('Test Case 3: should return NON-COMPLIANT when Net Quantity declaration is missing', () => {
    const missingQuantityProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Crunchy Potato Chips',
      commodityName: 'Potato Chips',
      manufacturer: 'ABC Foods India Pvt Ltd',
      mrp: '₹50',
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-222-3333'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(missingQuantityProduct);

    expect(result.overallStatus).toBe('NON_COMPLIANT');
    const qtyCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_C');
    expect(qtyCheck?.status).toBe('FAIL');
    expect(qtyCheck?.reason).toContain('Net quantity declaration could not be detected');
  });

  // Test Case 4: Consumer care information missing
  it('Test Case 4: should mark Consumer Care as FAIL / NON-COMPLIANT when contact details are absent', () => {
    const missingConsumerCareProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Crunchy Potato Chips',
      commodityName: 'Potato Chips',
      manufacturer: 'ABC Foods India Pvt Ltd',
      netQuantity: '100 g',
      mrp: '₹50',
      manufacturingDate: '06/2026'
      // No consumer care phone, email, or address
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(missingConsumerCareProduct);

    const careCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_N');
    expect(careCheck?.status).toBe('FAIL');
    expect(careCheck?.reason).toContain('Consumer care');
    expect(['NON_COMPLIANT', 'PARTIALLY_COMPLIANT']).toContain(result.overallStatus);
  });

  // Test Case 5: OCR reads quantity incorrectly (e.g. "500 9" candidate "500 g")
  it('Test Case 5: should flag REVIEW when OCR reads ambiguous quantity like "500 9"', () => {
    const noisyOcrProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Wheat Atta',
      commodityName: 'Wheat Flour',
      manufacturer: 'Aashirvaad Foods Ltd',
      netQuantity: '500 9', // Noisy OCR where 'g' became '9'
      mrp: '₹45',
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-111-2222'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(noisyOcrProduct);

    const qtyCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_C');
    expect(qtyCheck?.status).toBe('REVIEW');
    expect(qtyCheck?.candidateSuggestion).toBe('500 g');
    expect(qtyCheck?.ocrConfidence).toBeLessThan(0.85);
    expect(result.warnings.some((w) => w.includes('OCR ambiguity'))).toBe(true);
  });

  // Test Case 6: Product is exempt (Wholesale package > 25kg under Rule 26(a))
  it('Test Case 6: should return NOT_APPLICABLE for retail requirements on exempt wholesale package (> 25kg)', () => {
    const wholesaleProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Commercial Basmati Rice Sack',
      commodityName: 'Rice',
      manufacturer: 'Bharat Agri Ltd',
      netQuantity: '50 kg',
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-444-5555'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(wholesaleProduct);

    const qtyCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_C');
    expect(qtyCheck?.status).toBe('NOT_APPLICABLE');
    expect(qtyCheck?.reason).toContain('Rule 26(a)');

    const mrpCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_E');
    expect(mrpCheck?.status).toBe('NOT_APPLICABLE');
    expect(result.exemptions.length).toBeGreaterThan(0);
  });

  // Test Case 7: Misleading quantity expression ("approximately 500g")
  it('Test Case 7: should reject misleading quantity declaration ("approximately 500g") under Rule 11', () => {
    const misleadingProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Handmade Cookies',
      commodityName: 'Cookies',
      manufacturer: 'Boutique Bakery',
      netQuantity: 'approximately 500 g',
      mrp: '₹120',
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-555-6666'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(misleadingProduct);

    const qtyCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_C');
    expect(qtyCheck?.status).toBe('FAIL');
    expect(qtyCheck?.reason).toContain('Prohibited qualifier detected');
    expect(result.warnings.some((w) => w.includes('Illegal qualifier'))).toBe(true);
  });

  // Test Case 8: Conflicting dual MRP values detected
  it('Test Case 8: should flag REVIEW and WARNING when multiple conflicting MRPs are detected', () => {
    const dualMrpProduct: Partial<LegalMetrologyExtractedFields> = {
      productName: 'Instant Noodles',
      commodityName: 'Instant Noodles',
      manufacturer: 'Nestle India Ltd',
      netQuantity: '70 g',
      mrp: '₹14',
      multipleMrpDetected: true,
      allMrpValues: ['₹14', '₹16'],
      manufacturingDate: '06/2026',
      consumerCarePhone: '1800-777-8888'
    };

    const result = LegalMetrologyComplianceEngine.evaluateProduct(dualMrpProduct);

    const mrpCheck = result.checks.find((c) => c.ruleCode === 'RULE_6_1_E');
    expect(mrpCheck?.status).toBe('REVIEW');
    expect(mrpCheck?.reason).toContain('Multiple conflicting MRP values detected');
    expect(result.warnings.some((w) => w.includes('Multiple conflicting MRP'))).toBe(true);
  });

  // Test Case 9: Unit normalization retains original and normalized value
  it('Test Case 9: should normalize units properly (kg -> g, L -> ml)', () => {
    const norm1 = LegalMetrologyComplianceEngine.normalizeNetQuantity('1 kg');
    expect(norm1.quantity).toBe(1);
    expect(norm1.unit).toBe('kg');
    expect(norm1.normalizedValue).toBe('1000 g');

    const norm2 = LegalMetrologyComplianceEngine.normalizeNetQuantity('1 L');
    expect(norm2.quantity).toBe(1);
    expect(norm2.unit).toBe('L');
    expect(norm2.normalizedValue).toBe('1000 ml');
  });

  // Test Case 10: Maximum Permissible Error (MPE) calculations First Schedule
  it('Test Case 10: should calculate exact MPE based on the First Schedule', () => {
    // 500g -> 15g fixed error (from 500g to 1000g)
    const mpe500 = LegalMetrologyComplianceEngine.calculateMPE(500, 'g');
    expect(mpe500.permissibleError).toBe(15);
    expect(mpe500.minAcceptableQuantity).toBe(485);
    expect(mpe500.maxAcceptableQuantity).toBe(515);

    // 100g -> 4.5g fixed error (from 50g to 100g)
    const mpe100 = LegalMetrologyComplianceEngine.calculateMPE(100, 'g');
    expect(mpe100.permissibleError).toBe(4.5);
    expect(mpe100.minAcceptableQuantity).toBe(95.5);
    expect(mpe100.maxAcceptableQuantity).toBe(104.5);

    // 10 N count -> Nil error
    const mpe10N = LegalMetrologyComplianceEngine.calculateMPE(10, 'N');
    expect(mpe10N.permissibleError).toBe(0);
  });
});
