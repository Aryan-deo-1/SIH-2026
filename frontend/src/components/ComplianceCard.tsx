import React from 'react';
import { ComplianceCheckResult } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';

interface ComplianceCardProps {
  compliance: ComplianceCheckResult[];
}

export const ComplianceCard: React.FC<ComplianceCardProps> = ({ compliance }) => {
  if (!compliance || compliance.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'NON_COMPLIANT':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-brand-border/60">
        <div className="w-8 h-8 rounded-lg bg-brand-soft-orange flex items-center justify-center text-brand-primary-orange">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-brand-dark-text">Regulatory Compliance Checklist</h3>
          <p className="text-[11px] text-brand-secondary-text">Evaluated against FSSAI & ICMR dietary benchmarks</p>
        </div>
      </div>

      <div className="divide-y divide-brand-border/40">
        {compliance.map((c, i) => (
          <div key={i} className="py-2.5 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5 flex-1">
              {getStatusIcon(c.status)}
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-dark-text block">{c.message}</span>
                <span className="text-[11px] text-brand-secondary-text block">{c.reason}</span>
              </div>
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
              c.status === 'COMPLIANT'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : c.status === 'WARNING'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              {c.status.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
