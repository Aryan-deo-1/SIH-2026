import React from 'react';
import { Link } from 'react-router-dom';
import { RecommendationItem } from '../types';
import { Sparkles, ArrowRight, TrendingUp, Check, ShieldCheck } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: RecommendationItem;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const { candidateProduct, totalScore, reason, comparisons } = recommendation;

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-soft hover:shadow-soft-hover transition-all flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top Header: Match Score & Category */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-brand-secondary-text bg-[#FAF6F0] px-2 py-0.5 rounded-lg border border-brand-border">
            {candidateProduct.category}
          </span>
          <div className="flex items-center gap-1 bg-brand-soft-orange text-brand-primary-orange px-2.5 py-0.5 rounded-full text-xs font-bold border border-brand-light-orange">
            <Sparkles className="w-3 h-3" />
            <span>{totalScore}% Match</span>
          </div>
        </div>

        {/* Product Visual & Name */}
        <div className="flex items-center gap-3">
          <img
            src={candidateProduct.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
            alt={candidateProduct.name}
            className="w-16 h-16 rounded-xl object-cover bg-brand-soft-orange border border-brand-border shrink-0"
          />
          <div>
            <span className="text-xs font-semibold text-brand-primary-orange">{candidateProduct.brand}</span>
            <h4 className="font-heading text-sm font-bold text-brand-dark-text line-clamp-2">
              {candidateProduct.name}
            </h4>
            {candidateProduct.price && (
              <span className="text-xs font-bold text-brand-secondary-text">₹{candidateProduct.price}</span>
            )}
          </div>
        </div>

        {/* Reason Pill */}
        <div className="bg-emerald-50/80 border border-emerald-100 p-2.5 rounded-xl text-xs text-emerald-900">
          <span className="font-semibold block text-[11px] text-emerald-700 uppercase tracking-wide">
            Why this is a better match:
          </span>
          <p className="mt-0.5 leading-snug">{reason}</p>
        </div>

        {/* Comparative Chips */}
        {comparisons && comparisons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {comparisons.slice(0, 3).map((cmp, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#FAF6F0] border border-brand-border text-brand-dark-text px-2 py-0.5 rounded-md"
              >
                <Check className="w-3 h-3 text-emerald-600" />
                <span>{cmp.improvementText}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-brand-border/50 mt-3 flex items-center justify-between">
        <span className="text-[11px] text-brand-secondary-text">
          {candidateProduct.packSize || '100g'}
        </span>
        <Link
          to={`/product/${candidateProduct.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary-orange hover:text-brand-hover-orange transition-colors"
        >
          <span>View Alternative</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
