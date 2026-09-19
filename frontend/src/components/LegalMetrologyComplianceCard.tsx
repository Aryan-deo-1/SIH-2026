import React, { useState } from 'react';
import {
  LegalMetrologyComplianceResult,
  LegalMetrologyCheckItem,
  MPEResult
} from '../types';
import {
  Scale,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Percent,
  FileText
} from 'lucide-react';

interface Props {
  compliance?: LegalMetrologyComplianceResult;
}

export const LegalMetrologyComplianceCard: React.FC<Props> = ({ compliance }) => {
  const [expanded, setExpanded] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'FAIL' | 'REVIEW' | 'PASS'>('ALL');

  if (!compliance) return null;

  const { overallStatus, summary, checks, mpe, warnings, exemptions, disclaimer } = compliance;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>COMPLIANT</span>
          </span>
        );
      case 'PARTIALLY_COMPLIANT':
      case 'PARTIALLY COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>PARTIALLY COMPLIANT</span>
          </span>
        );
      case 'NON_COMPLIANT':
      case 'NON-COMPLIANT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>NON-COMPLIANT</span>
          </span>
        );
    }
  };

  const getCheckBadge = (status: LegalMetrologyCheckItem['status']) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>PASS</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>FAIL</span>
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>REVIEW</span>
          </span>
        );
      case 'NOT_APPLICABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span>N/A</span>
          </span>
        );
    }
  };

  const getConfidenceBadge = (confidence: number, label: string) => {
    const pct = Math.round(confidence * 100);
    if (label === 'HIGH' || confidence >= 0.85) {
      return <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">OCR: {pct}%</span>;
    }
    if (label === 'MODERATE' || confidence >= 0.5) {
      return <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">OCR: {pct}%</span>;
    }
    if (label === 'NOT_DETECTED') {
      return <span className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-1.5 py-0.5 rounded">Not Found</span>;
    }
    return <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded">Low Conf: {pct}%</span>;
  };

  const filteredChecks = checks.filter((c) => {
    if (activeFilter === 'ALL') return true;
    return c.status === activeFilter;
  });

  return (
    <div className="bg-white rounded-3xl border-2 border-brand-light-orange p-5 sm:p-7 shadow-soft space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-brand-soft-orange border border-brand-light-orange flex items-center justify-center text-brand-primary-orange shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg sm:text-xl font-black text-brand-dark-text tracking-tight">
                Legal Metrology Compliance
              </h2>
            </div>
            <p className="text-xs text-brand-secondary-text mt-0.5">
              Verified against mandatory declaration requirements of <strong>Legal Metrology (Packaged Commodities) Rules, 2011</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {getStatusBadge(overallStatus)}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-brand-secondary-text hover:text-brand-dark-text rounded-lg hover:bg-slate-100 transition-colors"
            title={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
        <div className="bg-[#FFFDFB] border border-brand-border rounded-xl p-2.5">
          <span className="text-[10px] font-bold text-brand-secondary-text uppercase tracking-wider block">Checked</span>
          <span className="text-lg font-black text-brand-dark-text">{summary.totalMandatory}</span>
        </div>
        <div
          onClick={() => setActiveFilter(activeFilter === 'PASS' ? 'ALL' : 'PASS')}
          className={`cursor-pointer border rounded-xl p-2.5 transition-all ${
            activeFilter === 'PASS' ? 'bg-emerald-100/70 border-emerald-400 shadow-xs' : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100/50'
          }`}
        >
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Passed</span>
          <span className="text-lg font-black text-emerald-700">{summary.passed}</span>
        </div>
        <div
          onClick={() => setActiveFilter(activeFilter === 'FAIL' ? 'ALL' : 'FAIL')}
          className={`cursor-pointer border rounded-xl p-2.5 transition-all ${
            activeFilter === 'FAIL' ? 'bg-rose-100/70 border-rose-400 shadow-xs' : 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/50'
          }`}
        >
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Failed</span>
          <span className="text-lg font-black text-rose-700">{summary.failed}</span>
        </div>
        <div
          onClick={() => setActiveFilter(activeFilter === 'REVIEW' ? 'ALL' : 'REVIEW')}
          className={`cursor-pointer border rounded-xl p-2.5 transition-all ${
            activeFilter === 'REVIEW' ? 'bg-amber-100/70 border-amber-400 shadow-xs' : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/50'
          }`}
        >
          <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Review</span>
          <span className="text-lg font-black text-amber-700">{summary.review}</span>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Exempt / N/A</span>
          <span className="text-lg font-black text-slate-700">{summary.notApplicable}</span>
        </div>
      </div>

      {/* Warnings & Anomalies Banner */}
      {warnings && warnings.length > 0 && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Compliance Warnings Detected</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-rose-800">
            {warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Exemptions Banner */}
      {exemptions && exemptions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Applicable Legal Exemptions</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-blue-800">
            {exemptions.map((ex, idx) => (
              <li key={idx}>{ex}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rule-by-Rule Results Table */}
      {expanded && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-brand-dark-text flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-brand-primary-orange" />
              <span>Mandatory Declaration Audit Trail</span>
            </h3>
            {activeFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setActiveFilter('ALL')}
                className="text-[11px] font-semibold text-brand-primary-orange hover:underline"
              >
                Clear filter (Show All)
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-brand-border">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF6F0] border-b border-brand-border text-brand-secondary-text font-bold text-[11px]">
                  <th className="py-3 px-4">Mandatory Requirement</th>
                  <th className="py-3 px-4">Detected Declaration</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4">Audit Explanation</th>
                  <th className="py-3 px-3 text-right">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {filteredChecks.map((check, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 align-top">
                      <span className="font-bold text-brand-dark-text block">{check.requirement}</span>
                      <span className="text-[10px] text-brand-secondary-text font-mono block mt-0.5">
                        {check.legalReference}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-top max-w-[200px]">
                      {check.detectedValue ? (
                        <div className="space-y-1">
                          <span className="font-medium text-brand-dark-text break-words block">
                            {check.detectedValue}
                          </span>
                          {check.normalizedValue && check.normalizedValue !== check.detectedValue && (
                            <span className="text-[10px] text-brand-secondary-text font-mono block bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                              Norm: {check.normalizedValue}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Not detected on label</span>
                      )}
                    </td>

                    <td className="py-3 px-3 align-top text-center">
                      {getCheckBadge(check.status)}
                    </td>

                    <td className="py-3 px-4 align-top text-brand-dark-text text-[11px] leading-relaxed">
                      {check.reason}
                      {check.candidateSuggestion && (
                        <span className="mt-1 block text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                          Suggested interpretation: <strong>{check.candidateSuggestion}</strong>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 align-top text-right shrink-0">
                      {getConfidenceBadge(check.ocrConfidence, check.confidenceLabel)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Maximum Permissible Error (MPE) Section */}
      {mpe && mpe.status !== 'NOT_APPLICABLE' && (
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-brand-border/60">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-brand-primary-orange" />
              <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-brand-dark-text">
                Maximum Permissible Error (MPE) — First Schedule
              </h4>
            </div>
            <span className="text-[10px] font-mono font-bold text-brand-secondary-text">
              First Schedule, LM Rules 2011
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white border border-brand-border rounded-xl p-3">
              <span className="text-[10px] font-bold text-brand-secondary-text uppercase block">Declared Net Quantity</span>
              <span className="text-base font-extrabold text-brand-dark-text mt-0.5 block">
                {mpe.declaredQuantity} {mpe.declaredUnit}
              </span>
            </div>

            <div className="bg-white border border-brand-border rounded-xl p-3">
              <span className="text-[10px] font-bold text-brand-secondary-text uppercase block">Permissible Tolerance (±)</span>
              <span className="text-base font-extrabold text-amber-700 mt-0.5 block">
                ±{mpe.permissibleError} {mpe.errorUnit}
              </span>
            </div>

            <div className="bg-white border border-brand-border rounded-xl p-3">
              <span className="text-[10px] font-bold text-brand-secondary-text uppercase block">Legal Acceptable Range</span>
              <span className="text-base font-extrabold text-emerald-700 mt-0.5 block">
                {mpe.minAcceptableQuantity} – {mpe.maxAcceptableQuantity} {mpe.declaredUnit}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-brand-secondary-text leading-relaxed">
            <strong>Legal Standard:</strong> {mpe.explanation}
          </p>
        </div>
      )}

      {/* Mandatory Statutory Disclaimer */}
      <div className="pt-2 border-t border-brand-border/60">
        <p className="text-[11px] text-brand-secondary-text italic leading-relaxed">
          <strong>Notice:</strong> {disclaimer}
        </p>
      </div>
    </div>
  );
};
