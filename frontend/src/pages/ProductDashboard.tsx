import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ScanResultPayload, StandardProduct } from '../types';
import { ScoreCard } from '../components/ScoreCard';
import { VerificationBadge } from '../components/VerificationBadge';
import { NutritionCard } from '../components/NutritionCard';
import { WarningCard } from '../components/WarningCard';
import { PositivesCard } from '../components/PositivesCard';
import { RecommendationCard } from '../components/RecommendationCard';
import { ComplianceCard } from '../components/ComplianceCard';
import { LegalMetrologyComplianceCard } from '../components/LegalMetrologyComplianceCard';
import { ExtractedDeclarationsCard } from '../components/ExtractedDeclarationsCard';
import {
  ArrowLeft,
  ScanLine,
  Share2,
  Bookmark,
  Check,
  Building,
  Package,
  Sparkles,
  AlertCircle,
  Tag,
  Barcode,
  Database,
  ExternalLink,
  AlertTriangle,
  Scale,
  HeartPulse,
  FileCheck2
} from 'lucide-react';

export const ProductDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<ScanResultPayload | null>(
    location.state?.scanResult || null
  );
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await api.getProduct(id);
        setData(payload);
      } catch (err: any) {
        console.error('Failed to load product dashboard', err);
        setError(err.response?.data?.error?.message || err.message || 'Product could not be retrieved');
      } finally {
        setLoading(false);
      }
    };

    // If we came directly from scan with state matching this ID, avoid duplicate fetch
    if (!data || data.product.id !== id) {
      loadProduct();
    }
  }, [id]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-primary-orange border-t-transparent animate-spin mx-auto"></div>
        <p className="font-heading text-base font-bold text-brand-dark-text">Loading Product Intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-heading text-xl font-bold text-brand-dark-text">Product Record Not Found</h2>
        <p className="text-xs text-brand-secondary-text">{error || 'Unable to locate product declarations.'}</p>
        <div className="pt-2 flex justify-center gap-2">
          <Link
            to="/scan"
            className="bg-brand-primary-orange text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Scan Another
          </Link>
          <Link
            to="/search"
            className="bg-white border border-brand-border text-brand-dark-text text-xs font-bold px-4 py-2 rounded-xl"
          >
            Manual Search
          </Link>
        </div>
      </div>
    );
  }

  const { product, score, warnings, positives, compliance, recommendations } = data;

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Back and Actions Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary-text hover:text-brand-primary-orange transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-brand-border px-3 py-1.5 rounded-xl shadow-xs hover:border-brand-primary-orange transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-brand-secondary-text" />}
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
          </button>
          <Link
            to="/scan"
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-primary-orange hover:bg-brand-hover-orange text-white px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Scan New</span>
          </Link>
        </div>
      </div>

      {/* OCR Estimate Notice Banner */}
      {product.sourceType === 'OCR_PARSED' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-900">
              Product Identity Not Verified Against Database
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Product identity could not be fully verified against official databases. This analysis is based purely on package text extracted via OCR image processing.
            </p>
          </div>
        </div>
      )}

      {/* Product Hero Header */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-8 shadow-soft">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Product Image */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF6F0] border border-brand-border/80 shadow-xs">
              <img
                src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.sourceType === 'EXTERNAL_CACHE' && (
                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md">
                  External Registry Cache
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="md:col-span-8 lg:col-span-9 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-primary-orange bg-brand-soft-orange px-2.5 py-0.5 rounded-md border border-brand-light-orange">
                {product.brand}
              </span>
              <span className="text-xs font-medium text-brand-secondary-text bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-brand-border">
                {product.category}
              </span>
              {product.barcodeGtIN && (
                <span className="text-xs font-mono text-brand-secondary-text bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-brand-border flex items-center gap-1">
                  <Barcode className="w-3.5 h-3.5" />
                  <span>{product.barcodeGtIN}</span>
                </span>
              )}
            </div>

            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text leading-tight">
              {product.name}
            </h1>

            {/* Manufacturer & Pack size */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-brand-secondary-text pt-1">
              {product.manufacturer && (
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-brand-primary-orange" />
                  <span>{product.manufacturer}</span>
                </span>
              )}
              {product.packSize && (
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-brand-primary-orange" />
                  <span>Pack Size: <strong>{product.packSize}</strong></span>
                </span>
              )}
              {product.price && (
                <span className="font-heading text-base font-extrabold text-brand-dark-text">
                  ₹{product.price}
                </span>
              )}
            </div>

            {/* Verification Status Banner embedded in hero */}
            <div className="pt-2">
              <VerificationBadge verification={product.verification} />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION A: LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011 COMPLIANCE  */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-8 h-8 rounded-xl bg-brand-soft-orange flex items-center justify-center text-brand-primary-orange">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-extrabold text-brand-dark-text">
              Part A: Legal Metrology Declarations Audit
            </h2>
            <p className="text-xs text-brand-secondary-text">
              Deterministic rule comparison under the Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011
            </p>
          </div>
        </div>

        {/* Legal Metrology Compliance Card */}
        {data.legalMetrology && (
          <LegalMetrologyComplianceCard compliance={data.legalMetrology} />
        )}

        {/* Extracted Package Declarations Card */}
        {data.legalMetrology?.extractedDeclarations && (
          <ExtractedDeclarationsCard declarations={data.legalMetrology.extractedDeclarations} />
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION B: HEALTH & NUTRITIONAL ANALYSIS                                   */}
      {/* ========================================================================= */}
      <section className="space-y-6 pt-4 border-t-2 border-brand-border/60">
        <div className="flex items-center gap-2.5 pb-1">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-extrabold text-brand-dark-text">
              Part B: Health & Nutritional Analysis
            </h2>
            <p className="text-xs text-brand-secondary-text">
              FSSAI & ICMR dietary benchmarks, quality score, additives, and allergen alerts
            </p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Score, Warnings & Positives */}
          <div className="lg:col-span-5 space-y-6">
            {/* Data Source & Provenance Card */}
            <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-primary-orange" />
                <h3 className="font-heading text-sm font-bold text-brand-dark-text">Data Source & Provenance</h3>
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                product.sourceType === 'EXTERNAL_CACHE' || product.sourceName?.includes('Open Food Facts')
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : product.sourceType === 'OCR_PARSED'
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {product.sourceName || (product.sourceType === 'EXTERNAL_CACHE' ? 'Open Food Facts' : 'PackCheck Database')}
              </span>
            </div>

            <div className="space-y-2 text-xs text-brand-secondary-text">
              <div className="flex items-center justify-between">
                <span>Origin Type:</span>
                <span className="font-medium text-brand-dark-text">
                  {product.sourceType === 'EXTERNAL_CACHE'
                    ? 'Global Food Registry (Open Food Facts)'
                    : product.sourceType === 'OCR_PARSED'
                    ? 'Optical Package Label Parsing'
                    : 'PackCheck Verified Database'}
                </span>
              </div>

              {product.externalProductId && (
                <div className="flex items-center justify-between">
                  <span>External ID:</span>
                  <span className="font-mono text-brand-dark-text">{product.externalProductId}</span>
                </div>
              )}

              {product.retrievedAt && (
                <div className="flex items-center justify-between">
                  <span>Retrieved:</span>
                  <span>{new Date(product.retrievedAt).toLocaleDateString()}</span>
                </div>
              )}

              {product.externalUrl && (
                <div className="pt-2 border-t border-brand-border/50">
                  <a
                    href={product.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  >
                    <span>View Record on Open Food Facts</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {product.provenanceNote && (
              <p className="text-[11px] bg-amber-50/70 border border-amber-200/70 text-amber-900 p-2.5 rounded-xl leading-relaxed">
                {product.provenanceNote}
              </p>
            )}
          </div>

          <ScoreCard score={score} />

          {/* Positives */}
          <PositivesCard positives={positives} />

          {/* Warnings */}
          <WarningCard warnings={warnings} />

          {/* Ingredients & Declared Allergens Card */}
          {product.ingredient && (
            <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
                <Tag className="w-4 h-4 text-brand-primary-orange" />
                <h3 className="font-heading text-base font-bold text-brand-dark-text">Declared Ingredients</h3>
              </div>
              <p className="text-xs text-brand-secondary-text leading-relaxed font-sans">
                {product.ingredient.ingredientText}
              </p>

              {product.ingredient.allergens && product.ingredient.allergens.length > 0 && (
                <div className="pt-2 border-t border-brand-border/50 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
                    Allergen Warnings
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredient.allergens.map((allergen, i) => (
                      <span
                        key={i}
                        className="bg-rose-50 text-rose-800 text-[11px] font-semibold px-2 py-0.5 rounded border border-rose-200"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Nutrition Charts & Regulatory Compliance */}
        <div className="lg:col-span-7 space-y-6">
          <NutritionCard nutrition={product.nutrition} />

          <ComplianceCard compliance={compliance} />
        </div>
      </div>
      </section>

      {/* Issues Found & Compliance Recommendations */}
      {data.legalMetrology && (data.legalMetrology.checks.some(c => c.status === 'FAIL' || c.status === 'REVIEW') || data.legalMetrology.warnings.length > 0) && (
        <section className="bg-amber-50/70 border-2 border-amber-200 rounded-3xl p-5 sm:p-7 space-y-4 shadow-soft">
          <div className="flex items-center gap-2 text-amber-950 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <h3 className="font-heading text-base font-extrabold">Issues & Discrepancies Identified</h3>
          </div>

          <div className="space-y-2 text-xs text-amber-900">
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
              {data.legalMetrology.checks
                .filter(c => c.status === 'FAIL' || c.status === 'REVIEW')
                .map((issue, i) => (
                  <li key={i}>
                    <strong>{issue.requirement}:</strong> {issue.reason}
                    {issue.candidateSuggestion && (
                      <span className="block text-[11px] text-amber-800 font-semibold mt-0.5">
                        OCR candidate note: {issue.candidateSuggestion}
                      </span>
                    )}
                  </li>
                ))}
              {data.legalMetrology.warnings.map((w, i) => (
                <li key={`warn-${i}`} className="text-rose-900 font-medium">
                  {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3 border-t border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950">
            <FileCheck2 className="w-4 h-4 text-brand-primary-orange shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Recommendation:</strong> Verify the physical package before making a final compliance determination. Automated OCR text extraction provides a preliminary audit and does not replace official legal inspection under the Legal Metrology Act, 2009.
            </p>
          </div>
        </section>
      )}

      {/* Recommendations Section: Better Alternatives */}
      {recommendations && recommendations.length > 0 && (
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-primary-orange" />
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-brand-dark-text">
                  Better Nutritional Alternatives
                </h2>
              </div>
              <p className="text-xs text-brand-secondary-text mt-0.5">
                Higher protein, lower sodium, or reduced sugar options evaluated in this commodity category
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
