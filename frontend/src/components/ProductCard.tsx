import React from 'react';
import { Link } from 'react-router-dom';
import { StandardProduct, QualityScoreResult } from '../types';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: StandardProduct;
  score?: QualityScoreResult;
  onCompareSelect?: (product: StandardProduct) => void;
  isCompareSelected?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  score,
  onCompareSelect,
  isCompareSelected
}) => {
  const numericScore = score?.score;
  const grade = score?.grade;

  const getGradeBadge = (g?: string) => {
    switch (g) {
      case 'A':
        return 'bg-emerald-600 text-white';
      case 'B':
        return 'bg-emerald-500 text-white';
      case 'C':
        return 'bg-amber-500 text-white';
      case 'D':
        return 'bg-orange-500 text-white';
      case 'E':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-brand-primary-orange text-white';
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-brand-border hover:border-brand-primary-orange/40 overflow-hidden shadow-soft hover:shadow-soft-hover transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Product Image & Badges */}
        <div className="relative h-44 w-full bg-[#FAF6F0] overflow-hidden">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>

          {/* Category Tag */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/95 backdrop-blur-xs text-brand-dark-text text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xs border border-brand-border">
              {product.category}
            </span>
          </div>

          {/* Quality Score Badge */}
          {numericScore !== undefined && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-brand-border">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[11px] font-black ${getGradeBadge(grade)}`}>
                {grade || 'C'}
              </span>
              <span className="font-heading font-extrabold text-xs text-brand-dark-text">
                {numericScore.toFixed(1)}
              </span>
            </div>
          )}

          {/* Verification Pill */}
          {product.verification?.status === 'Verified' && (
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1 bg-emerald-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              <ShieldCheck className="w-3 h-3" />
              <span>FSSAI Verified</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-brand-secondary-text">
            <span className="font-medium text-brand-primary-orange">{product.brand}</span>
            <span>{product.packSize || '100g'}</span>
          </div>

          {/* Data Source Provenance Pill */}
          <div className="flex items-center gap-1.5 pt-0.5">
            {product.sourceType === 'EXTERNAL_CACHE' || product.sourceName?.includes('Open Food Facts') ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Open Food Facts
              </span>
            ) : product.sourceType === 'OCR_PARSED' || product.sourceName?.includes('OCR') ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md" title="Product estimated from scanned package text">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                OCR / Package Image
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                PackCheck DB
              </span>
            )}
            {product.countryOfOrigin && (
              <span className="text-[10px] text-brand-secondary-text truncate">
                • {product.countryOfOrigin}
              </span>
            )}
          </div>

          <h3 className="font-heading text-sm font-bold text-brand-dark-text line-clamp-2 leading-snug group-hover:text-brand-primary-orange transition-colors">
            {product.name}
          </h3>

          {/* Key Nutrient Highlights */}
          {product.nutrition && (
            <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10px]">
              <div className="bg-brand-soft-orange/80 p-1.5 rounded-lg border border-brand-light-orange/50">
                <span className="text-brand-secondary-text block">Protein</span>
                <strong className="text-brand-dark-text font-mono font-bold">
                  {product.nutrition.protein !== undefined ? `${product.nutrition.protein}g` : 'N/A'}
                </strong>
              </div>
              <div className="bg-brand-soft-orange/80 p-1.5 rounded-lg border border-brand-light-orange/50">
                <span className="text-brand-secondary-text block">Sugar</span>
                <strong className="text-brand-dark-text font-mono font-bold">
                  {product.nutrition.sugar !== undefined ? `${product.nutrition.sugar}g` : 'N/A'}
                </strong>
              </div>
              <div className="bg-brand-soft-orange/80 p-1.5 rounded-lg border border-brand-light-orange/50">
                <span className="text-brand-secondary-text block">Calories</span>
                <strong className="text-brand-dark-text font-mono font-bold">
                  {product.nutrition.calories !== undefined ? `${product.nutrition.calories}` : 'N/A'}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 pt-0 border-t border-brand-border/40 mt-3 flex items-center justify-between gap-2">
        {product.price ? (
          <span className="font-heading text-base font-extrabold text-brand-dark-text">
            ₹{product.price}
          </span>
        ) : (
          <span className="text-xs text-brand-secondary-text">MRP upon pack</span>
        )}

        <div className="flex items-center gap-1.5">
          {onCompareSelect && (
            <button
              type="button"
              onClick={() => onCompareSelect(product)}
              className={`text-xs px-2.5 py-1.5 rounded-xl font-medium border transition-colors ${
                isCompareSelected
                  ? 'bg-brand-primary-orange text-white border-brand-primary-orange'
                  : 'bg-white border-brand-border text-brand-secondary-text hover:border-brand-primary-orange'
              }`}
            >
              {isCompareSelected ? 'Selected' : 'Compare'}
            </button>
          )}

          <Link
            to={`/product/${product.id}`}
            className="inline-flex items-center gap-1 bg-brand-soft-orange hover:bg-brand-light-orange text-brand-primary-orange font-semibold text-xs px-3 py-1.5 rounded-xl border border-brand-light-orange transition-colors active:scale-95"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
