import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

interface ProcessingAnimationProps {
  currentStage?: number; // 0 to 5
}

export const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({ currentStage = 0 }) => {
  const stages = [
    'OCR optical character recognition on package label',
    'Extracting product, manufacturer, quantity & MRP declarations',
    'Normalizing metric measurement units & date formats',
    'Comparing against Legal Metrology (Packaged Commodities) Rules, 2011',
    'Detecting missing/invalid declarations & computing MPE tolerances',
    'Generating comprehensive Legal Metrology & Health compliance report'
  ];

  const [activeStep, setActiveStep] = useState(currentStage);

  useEffect(() => {
    if (activeStep < stages.length - 1) {
      const timer = setTimeout(() => {
        setActiveStep((prev) => Math.min(prev + 1, stages.length - 1));
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeStep, stages.length]);

  return (
    <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 max-w-lg mx-auto shadow-soft text-center space-y-6">
      {/* Animated Spinner Icon */}
      <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-brand-soft-orange"></div>
        <div className="absolute inset-0 rounded-full border-4 border-brand-primary-orange border-t-transparent animate-spin"></div>
        <Sparkles className="w-6 h-6 text-brand-primary-orange" />
      </div>

      <div>
        <h3 className="font-heading text-xl font-extrabold text-brand-dark-text">
          Auditing Package Declarations...
        </h3>
        <p className="text-xs text-brand-secondary-text mt-1">
          Comparing OCR package declarations against the Legal Metrology (Packaged Commodities) Rules, 2011 & Nutrition benchmarks
        </p>
      </div>

      {/* Step Progression Checklist */}
      <div className="space-y-3 text-left bg-[#FAF6F0] p-4 rounded-2xl border border-brand-border/60">
        {stages.map((stage, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div key={idx} className="flex items-center gap-3 text-xs">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold transition-all ${
                  isDone
                    ? 'bg-brand-success text-white'
                    : isCurrent
                    ? 'bg-brand-primary-orange text-white animate-pulse'
                    : 'bg-white border border-brand-border text-brand-secondary-text'
                }`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isCurrent ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`font-medium transition-colors ${
                  isDone
                    ? 'text-brand-dark-text'
                    : isCurrent
                    ? 'text-brand-primary-orange font-bold'
                    : 'text-brand-secondary-text/80'
                }`}
              >
                {stage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
