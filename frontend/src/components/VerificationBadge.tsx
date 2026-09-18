import React from 'react';
import { StandardVerification, VerificationStatus } from '../types';
import { ShieldCheck, AlertCircle, HelpCircle, ExternalLink, FileCheck } from 'lucide-react';

interface VerificationBadgeProps {
  verification?: StandardVerification;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ verification }) => {
  const status: VerificationStatus = verification?.status || 'Verification Unavailable';
  const licenseNumber = verification?.identifier || 'N/A';
  const sourceUrl = verification?.sourceUrl || 'https://foscos.fssai.gov.in/';
  const details = verification?.details;

  const getStatusConfig = () => {
    switch (status) {
      case 'Verified':
        return {
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: ShieldCheck,
          iconColor: 'text-emerald-600',
          label: 'FSSAI License Verified',
          desc: '14-digit food business operator license verified on the official central FoSCoS portal.'
        };
      case 'Needs Review':
        return {
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: AlertCircle,
          iconColor: 'text-amber-600',
          label: 'Needs Regulatory Review',
          desc: 'License renewal, category update, or verification audit is flagged in central registry.'
        };
      case 'Mismatch':
        return {
          badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
          icon: AlertCircle,
          iconColor: 'text-rose-600',
          label: 'Registration Mismatch',
          desc: 'Discrepancy detected between declared retail packaging and official manufacturer filing.'
        };
      case 'Verification Unavailable':
      case 'Not Found':
      default:
        return {
          badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: HelpCircle,
          iconColor: 'text-slate-500',
          label: 'Official Evidence Unavailable',
          desc: 'No verifiable 14-digit FSSAI record was located. Product relies on declared manufacturer labels.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-4 shadow-sm transition-all ${config.badgeBg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl bg-white shadow-xs ${config.iconColor}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading text-sm font-bold">{config.label}</h4>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/80 border border-current">
                {status}
              </span>
            </div>
            <p className="text-xs mt-1 leading-relaxed opacity-90">{details || config.desc}</p>
            {licenseNumber && licenseNumber !== 'N/A' && (
              <div className="mt-2 text-xs font-mono font-medium flex items-center gap-1.5 opacity-90">
                <FileCheck className="w-3.5 h-3.5" />
                <span>License No: <strong>{licenseNumber}</strong></span>
              </div>
            )}
          </div>
        </div>

        {/* View Official Evidence Button */}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 flex items-center gap-1 bg-white hover:bg-white/80 text-brand-dark-text text-xs font-semibold px-3 py-1.5 rounded-xl border border-current shadow-xs transition-colors"
        >
          <span>View FoSCoS Evidence</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
