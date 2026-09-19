export interface StandardNutrition {
  servingSize?: string;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  sugar?: number;
  addedSugar?: number;
  fat?: number;
  saturatedFat?: number;
  transFat?: number;
  fiber?: number;
  sodium?: number; // mg
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  [key: string]: any;
}

export interface StandardIngredient {
  ingredientText: string;
  allergens: string[];
}

export type VerificationStatus =
  | 'Verified'
  | 'Needs Review'
  | 'Mismatch'
  | 'Verification Unavailable'
  | 'Not Found';

export interface StandardVerification {
  authority: string;
  identifier: string;
  status: VerificationStatus;
  evidenceType: string;
  sourceUrl?: string;
  checkedAt?: string;
  details?: string;
}

export interface StandardCertification {
  type: string;
  identifier: string;
  status: string;
  source?: string;
  evidenceUrl?: string;
}

export interface StandardProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  manufacturer?: string;
  barcodeGtIN?: string;
  packSize?: string;
  price?: number;
  imageUrl?: string;
  countryOfOrigin?: string;
  sourceType: 'INTERNAL' | 'EXTERNAL_CACHE' | 'USER_SUBMISSION' | 'OCR_PARSED' | 'OPEN_FOOD_FACTS';
  sourceName?: string;
  externalProductId?: string;
  externalUrl?: string;
  retrievedAt?: string;
  expiresAt?: string;
  provenanceNote?: string;
  nutrition?: StandardNutrition;
  ingredient?: StandardIngredient;
  verification?: StandardVerification;
  certifications?: StandardCertification[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QualityScoreFactor {
  factor: string;
  delta: number;
  reason: string;
  type: 'PENALTY' | 'BONUS' | 'NEUTRAL';
}

export interface QualityScoreResult {
  score: number; // 0 to 5.0
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  baseScore: number;
  factors: QualityScoreFactor[];
  summary: string;
}

export interface WarningItem {
  id: string;
  field: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  evidence: string;
}

export interface PositiveItem {
  id: string;
  field: string;
  title: string;
  message: string;
  evidence: string;
}

export interface ComplianceCheckResult {
  ruleId: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'EXEMPT';
  message: string;
  reason: string;
  evidence?: string;
}

export interface RecommendationMetricComparison {
  metric: string;
  sourceValue: string | number;
  candidateValue: string | number;
  improvementText: string;
  isBetter: boolean;
}

export interface RecommendationItem {
  candidateProduct: StandardProduct;
  totalScore: number; // 0-100 percentage
  nutritionScore: number;
  preferenceScore: number;
  priceScore: number;
  categoryScore: number;
  verificationScore: number;
  reason: string;
  comparisons: RecommendationMetricComparison[];
}

export interface DietFilterParams {
  category?: string;
  minProtein?: number;
  maxSugar?: number;
  maxSodium?: number;
  minFiber?: number;
  maxCalories?: number;
  maxFat?: number;
  budget?: number;
  search?: string;
  sortBy?: 'score' | 'protein' | 'price_asc' | 'calories_asc';
}

export interface LegalMetrologyCheckItem {
  ruleId: string;
  ruleCode: string;
  requirement: string;
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_APPLICABLE';
  detectedValue?: string | null;
  originalValue?: string | null;
  normalizedValue?: string | null;
  reason: string;
  ocrConfidence: number; // 0.0 - 1.0
  confidenceLabel: 'HIGH' | 'MODERATE' | 'LOW' | 'NOT_DETECTED';
  mandatory: boolean;
  legalReference: string;
  candidateSuggestion?: string | null;
}

export interface LegalMetrologySummary {
  totalMandatory: number;
  passed: number;
  failed: number;
  review: number;
  notApplicable: number;
}

export interface MPEResult {
  declaredQuantity: number;
  declaredUnit: string;
  permissibleError: number;
  errorUnit: string;
  minAcceptableQuantity: number;
  maxAcceptableQuantity: number;
  scheduleReference: string;
  status: 'PASS' | 'FAIL' | 'REVIEW' | 'NOT_APPLICABLE';
  explanation: string;
}

export interface LegalMetrologyExtractedFields {
  productName?: string;
  commodityName?: string;
  brand?: string;
  manufacturer?: string;
  manufacturerAddress?: string;
  packer?: string;
  packerAddress?: string;
  importer?: string;
  importerAddress?: string;
  netQuantity?: string;
  netQuantityValue?: number;
  netQuantityUnit?: string;
  normalizedQuantityValue?: number;
  normalizedQuantityUnit?: string;
  count?: number;
  isMisleadingQuantity?: boolean;
  misleadingReason?: string;
  mrp?: string;
  mrpNumeric?: number;
  currency?: string;
  multipleMrpDetected?: boolean;
  allMrpValues?: string[];
  unitSalePrice?: string;
  manufacturingDate?: string;
  packingDate?: string;
  importDate?: string;
  normalizedDate?: string;
  consumerCarePhone?: string;
  consumerCareEmail?: string;
  consumerCareAddress?: string;
  countryOfOrigin?: string;
  dimensions?: string;
  ocrConfidenceScores?: Record<string, number>;
  noiseCandidates?: Array<{ field: string; raw: string; candidate: string; confidence: number; note: string }>;
  isExempt?: boolean;
  exemptionReason?: string;
}

export interface LegalMetrologyComplianceResult {
  overallStatus: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
  summary: LegalMetrologySummary;
  checks: LegalMetrologyCheckItem[];
  mpe?: MPEResult | null;
  extractedDeclarations: LegalMetrologyExtractedFields;
  warnings: string[];
  exemptions: string[];
  disclaimer: string;
}

export interface ScanResultPayload {
  product: StandardProduct;
  score: QualityScoreResult;
  warnings: WarningItem[];
  positives: PositiveItem[];
  compliance: ComplianceCheckResult[];
  legalMetrology: LegalMetrologyComplianceResult;
  recommendations: RecommendationItem[];
  scanMeta?: {
    barcode?: string;
    ocrExtracted?: Record<string, any>;
    resolvedVia: 'INTERNAL_DB' | 'EXTERNAL_API' | 'OCR_ONLY' | 'MOCK_PROVIDER';
  };
}

