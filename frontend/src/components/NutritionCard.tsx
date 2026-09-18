import React from 'react';
import { StandardNutrition } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Utensils, Flame, Activity, Sparkles, Scale } from 'lucide-react';

interface NutritionCardProps {
  nutrition?: StandardNutrition;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({ nutrition }) => {
  if (!nutrition) {
    return (
      <div className="bg-white rounded-2xl border border-brand-border p-6 text-center text-brand-secondary-text shadow-soft">
        <Utensils className="w-8 h-8 mx-auto mb-2 text-brand-primary-orange opacity-60" />
        <p className="text-sm">Nutritional breakdown is unavailable on this package record.</p>
      </div>
    );
  }

  // Chart data for macronutrients
  const chartData = [
    { name: 'Protein', grams: nutrition.protein || 0, color: '#16A34A' }, // Emerald
    { name: 'Carbs', grams: nutrition.carbohydrates || 0, color: '#3B82F6' }, // Blue
    { name: 'Fat', grams: nutrition.fat || 0, color: '#F59E0B' }, // Amber
    { name: 'Sugar', grams: nutrition.sugar || 0, color: '#EF4444' }, // Red
    { name: 'Fiber', grams: nutrition.fiber || 0, color: '#10B981' } // Green
  ].filter((item) => item.grams > 0);

  const formatVal = (v: number | undefined, unit: string) =>
    v !== undefined ? `${v}${unit}` : '—';

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-soft-orange flex items-center justify-center text-brand-primary-orange">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-brand-dark-text">Nutritional Profile</h3>
            <p className="text-[11px] text-brand-secondary-text">Per {nutrition.servingSize || '100g'} standard reference</p>
          </div>
        </div>

        {nutrition.calories && (
          <div className="flex items-center gap-1.5 bg-brand-soft-orange px-3 py-1 rounded-xl border border-brand-light-orange">
            <Flame className="w-4 h-4 text-brand-primary-orange fill-brand-primary-orange" />
            <span className="font-heading font-extrabold text-sm text-brand-dark-text">
              {nutrition.calories} <span className="text-[10px] font-normal text-brand-secondary-text">kcal</span>
            </span>
          </div>
        )}
      </div>

      {/* Macronutrient Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-[#FAF6F0] border border-brand-border">
          <span className="text-[11px] font-medium text-brand-secondary-text block">Protein</span>
          <span className="font-heading text-lg font-extrabold text-emerald-700 font-mono block">
            {formatVal(nutrition.protein, 'g')}
          </span>
          <span className="text-[10px] text-brand-secondary-text">Muscle & recovery</span>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF6F0] border border-brand-border">
          <span className="text-[11px] font-medium text-brand-secondary-text block">Carbohydrates</span>
          <span className="font-heading text-lg font-extrabold text-brand-dark-text font-mono block">
            {formatVal(nutrition.carbohydrates, 'g')}
          </span>
          <span className="text-[10px] text-brand-secondary-text">Energy source</span>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF6F0] border border-brand-border">
          <span className="text-[11px] font-medium text-brand-secondary-text block">Total Sugar</span>
          <span className={`font-heading text-lg font-extrabold font-mono block ${
            nutrition.sugar && nutrition.sugar >= 15 ? 'text-rose-600' : 'text-brand-dark-text'
          }`}>
            {formatVal(nutrition.sugar, 'g')}
          </span>
          <span className="text-[10px] text-brand-secondary-text">
            {nutrition.addedSugar !== undefined ? `(${nutrition.addedSugar}g added)` : 'Simple carbs'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#FAF6F0] border border-brand-border">
          <span className="text-[11px] font-medium text-brand-secondary-text block">Sodium</span>
          <span className={`font-heading text-lg font-extrabold font-mono block ${
            nutrition.sodium && nutrition.sodium >= 600 ? 'text-rose-600' : 'text-brand-dark-text'
          }`}>
            {formatVal(nutrition.sodium, 'mg')}
          </span>
          <span className="text-[10px] text-brand-secondary-text">Daily electrolyte</span>
        </div>
      </div>

      {/* Recharts Bar Distribution Chart */}
      {chartData.length > 0 && (
        <div className="pt-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary-text mb-3">
            Macronutrient Distribution (grams per 100g)
          </h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} unit="g" />
                <Tooltip
                  formatter={(val: any) => [`${val}g`, 'Content']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    borderColor: '#F1E5D7',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="grams" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Nutrition Table */}
      <div className="pt-2 border-t border-brand-border/60">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-brand-secondary-text mb-2">
          Full Label Declarations
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <tbody className="divide-y divide-brand-border/40">
              <tr>
                <td className="py-2 text-brand-secondary-text font-medium">Total Fat</td>
                <td className="py-2 text-right font-mono font-semibold">{formatVal(nutrition.fat, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 pl-4 text-brand-secondary-text">↳ Saturated Fat</td>
                <td className="py-2 text-right font-mono">{formatVal(nutrition.saturatedFat, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 pl-4 text-brand-secondary-text">↳ Trans Fat</td>
                <td className="py-2 text-right font-mono">{formatVal(nutrition.transFat, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 text-brand-secondary-text font-medium">Total Carbohydrates</td>
                <td className="py-2 text-right font-mono font-semibold">{formatVal(nutrition.carbohydrates, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 pl-4 text-brand-secondary-text">↳ Dietary Fiber</td>
                <td className="py-2 text-right font-mono font-medium text-emerald-700">{formatVal(nutrition.fiber, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 pl-4 text-brand-secondary-text">↳ Total Sugar</td>
                <td className="py-2 text-right font-mono">{formatVal(nutrition.sugar, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 pl-8 text-brand-secondary-text">↳ Added Sugar</td>
                <td className="py-2 text-right font-mono">{formatVal(nutrition.addedSugar, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 text-brand-secondary-text font-medium">Protein</td>
                <td className="py-2 text-right font-mono font-bold text-emerald-700">{formatVal(nutrition.protein, 'g')}</td>
              </tr>
              <tr>
                <td className="py-2 text-brand-secondary-text font-medium">Sodium</td>
                <td className="py-2 text-right font-mono">{formatVal(nutrition.sodium, 'mg')}</td>
              </tr>
              {nutrition.calcium !== undefined && (
                <tr>
                  <td className="py-2 text-brand-secondary-text">Calcium</td>
                  <td className="py-2 text-right font-mono">{nutrition.calcium}mg</td>
                </tr>
              )}
              {nutrition.iron !== undefined && (
                <tr>
                  <td className="py-2 text-brand-secondary-text">Iron</td>
                  <td className="py-2 text-right font-mono">{nutrition.iron}mg</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
