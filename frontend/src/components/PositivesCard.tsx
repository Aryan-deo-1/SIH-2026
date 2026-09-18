import React from 'react';
import { PositiveItem } from '../types';
import { CheckCircle, Sparkles } from 'lucide-react';

interface PositivesCardProps {
  positives: PositiveItem[];
}

export const PositivesCard: React.FC<PositivesCardProps> = ({ positives }) => {
  if (positives.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-soft space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-emerald-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-emerald-950">Nutritional Highlights</h3>
          <p className="text-[11px] text-brand-secondary-text">Data-supported positive health attributes</p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {positives.map((pos) => (
          <div
            key={pos.id}
            className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="font-heading text-xs font-bold text-emerald-900">{pos.title}</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">{pos.message}</p>
              <span className="inline-block text-[10px] font-mono text-emerald-700 font-medium">
                Data: {pos.evidence}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
