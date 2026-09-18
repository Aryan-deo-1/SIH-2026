import React from 'react';
import { WarningItem } from '../types';
import { AlertTriangle, AlertOctagon, Info, ShieldAlert } from 'lucide-react';

interface WarningCardProps {
  warnings: WarningItem[];
}

export const WarningCard: React.FC<WarningCardProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return null;
  }

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'bg-rose-600 text-white',
          icon: AlertOctagon,
          iconColor: 'text-rose-600'
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-500 text-white',
          icon: AlertTriangle,
          iconColor: 'text-amber-600'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-800',
          badge: 'bg-slate-500 text-white',
          icon: Info,
          iconColor: 'text-slate-500'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-rose-200/80 p-5 shadow-soft space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b border-rose-100">
        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-heading text-base font-bold text-rose-950">Nutritional & Label Advisories</h3>
          <p className="text-[11px] text-brand-secondary-text">Evidence-based warnings derived from packaging declaration</p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {warnings.map((w) => {
          const style = getSeverityStyle(w.severity);
          const Icon = style.icon;
          return (
            <div
              key={w.id}
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${style.bg}`}
            >
              <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${style.iconColor}`} />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-heading text-xs font-bold">{w.title}</h4>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${style.badge}`}>
                    {w.severity}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-95">{w.message}</p>
                <span className="inline-block text-[10px] font-mono opacity-75 mt-0.5">
                  Evidence: {w.evidence}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
