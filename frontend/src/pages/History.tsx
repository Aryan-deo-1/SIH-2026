import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScanHistoryItem } from '../types';
import { Link } from 'react-router-dom';
import { History as HistoryIcon, Trash2, ArrowRight, ShieldCheck, Award, Calendar, Barcode } from 'lucide-react';

export const History: React.FC = () => {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClear = async () => {
    if (window.confirm('Are you sure you want to clear your entire scan history?')) {
      await api.clearHistory();
      setHistory([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Title & Clear Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-brand-border">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
            Scan History
          </h1>
          <p className="text-xs sm:text-sm text-brand-secondary-text">
            Timeline of your recent packaging evaluations, barcode lookups, and compliance checks.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl font-bold transition-colors w-fit"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* History List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-brand-secondary-text font-semibold">
          Loading scan records...
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-3">
          {history.map((item) => {
            const prod = item.product;
            const score = item.score?.score;
            const dateStr = new Date(item.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-brand-border p-4 shadow-soft hover:shadow-soft-hover transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={prod?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                    alt={prod?.name || 'Scanned product'}
                    className="w-14 h-14 rounded-xl object-cover border border-brand-border bg-[#FAF6F0] shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-primary-orange">{prod?.brand || 'Scanned Item'}</span>
                      {item.barcode && (
                        <span className="text-[10px] font-mono text-brand-secondary-text bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-brand-border flex items-center gap-1">
                          <Barcode className="w-3 h-3" />
                          <span>{item.barcode}</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-sm font-bold text-brand-dark-text line-clamp-1">
                      {prod?.name || 'Unidentified Commodity Scan'}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-brand-secondary-text">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{dateStr}</span>
                      </span>
                      {item.verificationStatus === 'Verified' && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>FSSAI Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score & Direct View Link */}
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-brand-border/40">
                  {score !== undefined && (
                    <div className="flex items-center gap-1.5 bg-brand-soft-orange px-3 py-1 rounded-xl border border-brand-light-orange">
                      <Award className="w-4 h-4 text-brand-primary-orange" />
                      <span className="font-heading text-xs font-extrabold text-brand-dark-text">
                        {score.toFixed(1)} / 5.0
                      </span>
                    </div>
                  )}

                  {prod && (
                    <Link
                      to={`/product/${prod.id}`}
                      className="inline-flex items-center gap-1 bg-white hover:bg-brand-soft-orange text-brand-primary-orange text-xs font-bold px-3.5 py-1.5 rounded-xl border border-brand-border shadow-xs transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center max-w-md mx-auto space-y-3 shadow-soft">
          <HistoryIcon className="w-10 h-10 text-brand-secondary-text/50 mx-auto" />
          <h3 className="font-heading text-base font-bold text-brand-dark-text">No Scan History Yet</h3>
          <p className="text-xs text-brand-secondary-text">
            Scanned barcodes, uploaded photos, and manual searches will be recorded here for instant re-inspection.
          </p>
          <div className="pt-2">
            <Link
              to="/scan"
              className="bg-brand-primary-orange text-white text-xs font-bold px-4 py-2 rounded-xl inline-block"
            >
              Scan Your First Product
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
