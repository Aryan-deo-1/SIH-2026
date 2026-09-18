import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ComparisonReport, StandardProduct } from '../types';
import { Scale, Plus, X, Award, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Compare: React.FC = () => {
  const [availableProducts, setAvailableProducts] = useState<StandardProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [report, setReport] = useState<ComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.getProducts();
        setAvailableProducts(list);
        if (list.length >= 2) {
          // Default compare first two items (e.g. Lays vs Too Yumm)
          setSelectedIds([list[0].id, list[1].id]);
        }
      } catch (err) {
        console.error('Failed to load products for comparison', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedIds.length >= 2) {
      loadComparison(selectedIds);
    } else {
      setReport(null);
    }
  }, [selectedIds]);

  const loadComparison = async (ids: string[]) => {
    setLoading(true);
    try {
      const data = await api.compare(ids);
      setReport(data);
    } catch (err) {
      console.error('Failed to compare products', err);
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const addProduct = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 4) {
      setSelectedIds((prev) => [...prev, id]);
    }
    setSelectorOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-brand-soft-orange text-brand-primary-orange flex items-center justify-center mx-auto">
          <Scale className="w-5 h-5" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
          Product Comparison
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary-text">
          Compare 2 to 4 packaged commodities side-by-side to highlight macronutrient deltas, score advantages, and licensing statuses.
        </p>
      </div>

      {/* Selected Products Toolbar */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-brand-dark-text">
            Comparing ({selectedIds.length}/4 Products)
          </span>
          {selectedIds.length < 4 && (
            <button
              type="button"
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-bold bg-brand-primary-orange text-white px-3 py-1.5 rounded-xl shadow-xs hover:bg-brand-hover-orange transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Selected Product Badges */}
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const prod = availableProducts.find((p) => p.id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-2 bg-[#FAF6F0] border border-brand-border px-3 py-1.5 rounded-xl text-xs font-semibold text-brand-dark-text"
              >
                <span>{prod?.name || id}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(id)}
                  className="text-brand-secondary-text hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Dropdown to add product */}
        {selectorOpen && (
          <div className="pt-3 border-t border-brand-border/60">
            <span className="text-[11px] font-bold text-brand-secondary-text uppercase tracking-wider block mb-2">
              Select product to add:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {availableProducts
                .filter((p) => !selectedIds.includes(p.id))
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProduct(p.id)}
                    className="p-2 rounded-xl text-left bg-white border border-brand-border hover:border-brand-primary-orange hover:bg-brand-soft-orange text-xs flex items-center justify-between"
                  >
                    <span className="truncate pr-2 font-medium">{p.name}</span>
                    <Plus className="w-3.5 h-3.5 text-brand-primary-orange shrink-0" />
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Comparison Presentation */}
      {loading ? (
        <div className="py-16 text-center text-xs font-semibold text-brand-secondary-text">
          Calculating side-by-side nutritional metrics...
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-brand-soft-orange/80 border border-brand-light-orange p-4 rounded-2xl text-xs text-brand-dark-text flex items-center gap-2 shadow-xs">
            <Award className="w-4 h-4 text-brand-primary-orange shrink-0" />
            <span className="font-semibold">{report.summary}</span>
          </div>

          {/* Side-by-side Table (Responsive with Horizontal Scroll on mobile) */}
          <div className="bg-white rounded-3xl border border-brand-border overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border bg-[#FAF6F0]">
                    <th className="p-4 font-heading text-xs font-bold uppercase tracking-wider text-brand-secondary-text w-44">
                      Nutritional Metric
                    </th>
                    {report.products.map((item, idx) => (
                      <th key={idx} className="p-4 min-w-[200px] border-l border-brand-border/60">
                        <div className="space-y-2">
                          <img
                            src={item.product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'}
                            alt={item.product.name}
                            className="w-14 h-14 rounded-xl object-cover border border-brand-border"
                          />
                          <div>
                            <span className="text-[10px] font-bold text-brand-primary-orange uppercase block">
                              {item.product.brand}
                            </span>
                            <span className="font-heading font-bold text-xs text-brand-dark-text block line-clamp-2">
                              {item.product.name}
                            </span>
                          </div>
                          <Link
                            to={`/product/${item.product.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-primary-orange hover:underline pt-1"
                          >
                            <span>Full Dashboard</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {report.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-[#FFFDFB] transition-colors">
                      <td className="p-4 font-semibold text-brand-dark-text">
                        <span>{row.metric}</span>
                        {row.unit && <span className="text-[10px] text-brand-secondary-text block">{row.unit}</span>}
                      </td>
                      {row.values.map((val, colIdx) => {
                        const isBest = row.bestIndex === colIdx;
                        return (
                          <td
                            key={colIdx}
                            className={`p-4 border-l border-brand-border/60 font-mono text-xs ${
                              isBest
                                ? 'bg-emerald-50/50 text-emerald-900 font-extrabold'
                                : 'text-brand-dark-text'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{val !== undefined && val !== null ? String(val) : '—'}</span>
                              {isBest && (
                                <span className="bg-emerald-600 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shadow-xs ml-2">
                                  Best
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center text-xs text-brand-secondary-text shadow-soft">
          Please select at least 2 products above to generate a side-by-side comparison.
        </div>
      )}
    </div>
  );
};
