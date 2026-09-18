import React from 'react';
import { QualityScoreResult } from '../types';
import { Award, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Info } from 'lucide-react';

interface ScoreCardProps {
  score: QualityScoreResult;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({ score }) => {
  const { score: numericScore, grade, factors, summary } = score;

  // Color mapping based on score
  const getScoreTheme = (val: number) => {
    if (val >= 4.0) {
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        badge: 'bg-emerald-600 text-white',
        ring: 'stroke-emerald-500',
        icon: CheckCircle2,
      };
    }
    if (val >= 2.5) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        badge: 'bg-amber-500 text-white',
        ring: 'stroke-amber-500',
        icon: Info,
      };
    }
    return {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-700',
      badge: 'bg-rose-600 text-white',
      ring: 'stroke-rose-500',
      icon: AlertTriangle,
    };
  };

  const theme = getScoreTheme(numericScore);
  const circumference = 2 * Math.PI * 40; // r=40
  const progress = (numericScore / 5.0) * circumference;
  const strokeDashoffset = circumference - progress;

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft hover:shadow-soft-hover transition-all">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-soft-orange flex items-center justify-center text-brand-primary-orange">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-brand-dark-text">Quality Score</h3>
            <p className="text-[11px] text-brand-secondary-text">Deterministic 0–5.0 FSSAI/ICMR health rating</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.badge}`}>
          Grade {grade}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 my-4">
        {/* Radial SVG Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-[#F1E5D7]"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              className={`${theme.ring} transition-all duration-1000 ease-out`}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-heading text-3xl font-extrabold text-brand-dark-text tracking-tight">
              {numericScore.toFixed(1)}
            </span>
            <span className="text-[10px] text-brand-secondary-text font-medium -mt-1">out of 5.0</span>
          </div>
        </div>

        {/* Score Summary */}
        <div className="space-y-1.5 text-center sm:text-left">
          <p className="text-sm font-semibold text-brand-dark-text">
            {numericScore >= 4.0 ? 'Nutritionally Clean Choice' : numericScore >= 2.5 ? 'Moderate Nutritional Balance' : 'High Processing / Caution Advised'}
          </p>
          <p className="text-xs text-brand-secondary-text leading-relaxed">
            {summary}
          </p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1 text-[11px]">
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">
              <TrendingUp className="w-3 h-3" />
              {factors.filter(f => f.type === 'BONUS').length} Positives
            </span>
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">
              <TrendingDown className="w-3 h-3" />
              {factors.filter(f => f.type === 'PENALTY').length} Deductions
            </span>
          </div>
        </div>
      </div>

      {/* Factor Breakdown Accordion / List */}
      <div className="pt-3 border-t border-brand-border/60">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary-text mb-2">
          Score Breakdown Factors
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {factors.map((f, i) => (
            <div
              key={i}
              className={`flex items-start justify-between text-xs p-2 rounded-lg ${
                f.type === 'BONUS'
                  ? 'bg-emerald-50/60 border border-emerald-100 text-emerald-900'
                  : 'bg-rose-50/60 border border-rose-100 text-rose-900'
              }`}
            >
              <div className="space-y-0.5 pr-2">
                <span className="font-semibold block">{f.factor}</span>
                <span className="text-[11px] text-brand-secondary-text block">{f.reason}</span>
              </div>
              <span
                className={`font-mono font-bold shrink-0 ${
                  f.type === 'BONUS' ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {f.delta > 0 ? `+${f.delta.toFixed(1)}` : `${f.delta.toFixed(1)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
