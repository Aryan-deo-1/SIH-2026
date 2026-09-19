export interface LegalMetrologyRuleRecord {
  id: string;
  ruleCode: string;
  requirementName: string;
  description: string;
  mandatory: boolean;
  validationType: 'EXISTS' | 'FORMAT' | 'UNIT_METRIC' | 'MPE' | 'DATE' | 'CONTACT';
  legalReference: string;
  categoryApplicability: 'ALL' | 'IMPORTED_ONLY' | 'RETAIL_PACK' | 'DIMENSION_APPLICABLE';
}

export const LEGAL_METROLOGY_RULES_2011: LegalMetrologyRuleRecord[] = [
  {
    id: 'LM-001',
    ruleCode: 'RULE_6_1_B',
    requirementName: 'Commodity Name',
    description: 'Common or generic name of the commodity contained in the package.',
    mandatory: true,
    validationType: 'EXISTS',
    legalReference: 'Rule 6(1)(b) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'ALL'
  },
  {
    id: 'LM-002',
    ruleCode: 'RULE_6_1_A',
    requirementName: 'Manufacturer / Packer / Importer',
    description: 'Name and complete address of the manufacturer, packer (if different), or importer.',
    mandatory: true,
    validationType: 'EXISTS',
    legalReference: 'Rule 6(1)(a) & (ab) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'ALL'
  },
  {
    id: 'LM-003',
    ruleCode: 'RULE_6_1_C',
    requirementName: 'Net Quantity',
    description: 'Net quantity declared in terms of standard unit of weight, measure or number.',
    mandatory: true,
    validationType: 'UNIT_METRIC',
    legalReference: 'Rule 6(1)(c) & Rules 11, 12, 13 of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'RETAIL_PACK'
  },
  {
    id: 'LM-004',
    ruleCode: 'RULE_6_1_E',
    requirementName: 'Maximum Retail Price (MRP)',
    description: 'Retail sale price in Indian Rupees (₹ / Rs.) inclusive of all taxes.',
    mandatory: true,
    validationType: 'FORMAT',
    legalReference: 'Rule 6(1)(e) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'RETAIL_PACK'
  },
  {
    id: 'LM-005',
    ruleCode: 'RULE_6_1_D',
    requirementName: 'Month and Year of Manufacture / Packing / Import',
    description: 'Month and year of manufacture (MFD), pre-packing (PKD), or import.',
    mandatory: true,
    validationType: 'DATE',
    legalReference: 'Rule 6(1)(d) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'ALL'
  },
  {
    id: 'LM-006',
    ruleCode: 'RULE_6_1_N',
    requirementName: 'Consumer Care Details',
    description: 'Name, address, telephone number, and email of person or office for consumer complaints.',
    mandatory: true,
    validationType: 'CONTACT',
    legalReference: 'Rule 6(1)(n) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'ALL'
  },
  {
    id: 'LM-007',
    ruleCode: 'RULE_6_1_AA',
    requirementName: 'Country of Origin',
    description: 'Name of the country of origin or manufacture for imported commodities.',
    mandatory: false, // Mandatory only if imported
    validationType: 'EXISTS',
    legalReference: 'Rule 6(1)(aa) of the Legal Metrology (Packaged Commodities) Rules, 2011',
    categoryApplicability: 'IMPORTED_ONLY'
  },
  {
    id: 'LM-008',
    ruleCode: 'RULE_6_1_E_USP',
    requirementName: 'Unit Sale Price (USP)',
    description: 'Unit sale price declared per gram, per ml, or per item where pack size exceeds 100g or 100ml.',
    mandatory: false, // Recommended/mandated for multi-piece or packs > 100g
    validationType: 'FORMAT',
    legalReference: 'Rule 6(1)(e) Amendment (Unit Sale Price) of LM (PC) Rules',
    categoryApplicability: 'RETAIL_PACK'
  }
];

export const STANDARD_LEGAL_METROLOGY_DISCLAIMER =
  'This tool provides an automated preliminary assessment based on OCR and the declarations detected on the package. It is not a legal certification or substitute for official inspection under applicable law.';
