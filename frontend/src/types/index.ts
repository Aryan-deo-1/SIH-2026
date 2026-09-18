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
  sodium?: number;
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
  score: number;
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
  totalScore: number;
  nutritionScore: number;
  preferenceScore: number;
  priceScore: number;
  categoryScore: number;
  verificationScore: number;
  reason: string;
  comparisons: RecommendationMetricComparison[];
}

export interface ScanResultPayload {
  product: StandardProduct;
  score: QualityScoreResult;
  warnings: WarningItem[];
  positives: PositiveItem[];
  compliance: ComplianceCheckResult[];
  recommendations: RecommendationItem[];
  scanMeta?: {
    barcode?: string;
    ocrExtracted?: Record<string, any>;
    resolvedVia: 'INTERNAL_DB' | 'EXTERNAL_API' | 'OCR_ONLY' | 'MOCK_PROVIDER';
  };
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
  sortBy?: 'score' | 'protein' | 'price_asc' | 'calories_asc';
}

export interface DietFinderResult {
  product: StandardProduct;
  matchScore: number;
  qualityScore: number;
  highlightReasons: string[];
}

export interface ComparisonReport {
  products: {
    product: StandardProduct;
    score: QualityScoreResult;
  }[];
  rows: {
    metric: string;
    unit: string;
    values: (string | number | undefined)[];
    bestIndex?: number;
    highlightText?: string;
  }[];
  summary: string;
}

export interface ScanHistoryItem {
  id: string;
  barcode?: string;
  createdAt: string;
  imagePath?: string;
  product?: StandardProduct;
  score?: QualityScoreResult;
  verificationStatus: VerificationStatus;
}
