import React from 'react';
import { ShieldCheck, Info, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-brand-border mt-16 pb-20 md:pb-8 pt-10 text-xs text-brand-secondary-text">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-brand-border">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary-orange flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-heading text-lg font-bold text-brand-dark-text">PackCheck</span>
            </div>
            <p className="text-brand-secondary-text leading-relaxed max-w-md">
              Package & Commodity Compliance Checker. Scan packaged consumer food products to decode nutritional tables, verify official FSSAI licensing evidence, spot hidden additives, and discover better alternatives.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-brand-secondary-text">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
              <span>Systems active: Deterministic Scoring • FSSAI FoSCoS Registry • OpenFoodFacts Registry</span>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-brand-dark-text">Navigation</h4>
            <ul className="space-y-1.5">
              <li><Link to="/scan" className="hover:text-brand-primary-orange transition-colors">Barcode & OCR Scanner</Link></li>
              <li><Link to="/search" className="hover:text-brand-primary-orange transition-colors">Manual Product Search</Link></li>
              <li><Link to="/diet" className="hover:text-brand-primary-orange transition-colors">Diet Finder</Link></li>
              <li><Link to="/compare" className="hover:text-brand-primary-orange transition-colors">Product Comparison</Link></li>
              <li><Link to="/history" className="hover:text-brand-primary-orange transition-colors">Scan History</Link></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-brand-dark-text">Regulatory Authorities</h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://foscos.fssai.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-brand-primary-orange transition-colors"
                >
                  <span>FSSAI FoSCoS Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://fssai.gov.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-brand-primary-orange transition-colors"
                >
                  <span>FSSAI Central Authority</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.main.icmr.nic.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-brand-primary-orange transition-colors"
                >
                  <span>ICMR RDA Standards</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory Disclaimer Banner */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-brand-secondary-text">
          <div className="flex items-start gap-2 max-w-2xl">
            <Info className="w-4 h-4 text-brand-primary-orange shrink-0 mt-0.5" />
            <p>
              <strong>Compliance Notice:</strong> PackCheck provides automated nutritional analysis based on declared packaging information, OCR extracts, and official regulatory registries. Government verification claims are displayed strictly when backed by public FoSCoS/FSSAI records. This software is an informational aid and does not constitute clinical medical advice.
            </p>
          </div>
          <div>
            © {new Date().getFullYear()} PackCheck. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
