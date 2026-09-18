import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DietFinderResult, DietFilterParams } from '../types';
import { ProductCard } from '../components/ProductCard';
import {
  Salad,
  SlidersHorizontal,
  Sparkles,
  Check,
  RefreshCw,
  Award,
  Flame,
  Scale
} from 'lucide-react';

export const DietFinder: React.FC = () => {
  const [params, setParams] = useState<DietFilterParams>({
    category: 'ALL',
    minProtein: 10,
    maxSugar: 10,
    maxSodium: 500,
    minFiber: 3,
    maxCalories: 450,
    budget: 500,
    sortBy: 'score'
  });

  const [results, setResults] = useState<DietFinderResult[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    'ALL',
    'Chips',
    'Biscuits',
    'Peanut Butter',
    'Cereal',
    'Milk',
    'Juice',
    'Instant Noodles',
    'Protein Products',
    'Snacks'
  ];

  const runDietSearch = async () => {
    setLoading(true);
    try {
      const data = await api.searchDiet(params);
      setResults(data);
    } catch (err) {
      console.error('Diet search error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      runDietSearch();
    }, 250);
    return () => clearTimeout(timer);
  }, [params]);

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <Salad className="w-5 h-5" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
          Diet & Macro Finder
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary-text">
          Configure custom nutritional targets and budgetary limits to discover perfectly aligned packaged commodities.
        </p>
      </div>

      {/* Interactive Controls & Filters Card */}
      <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-7 shadow-soft space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-brand-primary-orange" />
            <h3 className="font-heading text-sm font-bold text-brand-dark-text">Dietary Parameters</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              setParams({
                category: 'ALL',
                minProtein: 10,
                maxSugar: 10,
                maxSodium: 500,
                minFiber: 3,
                maxCalories: 450,
                budget: 500,
                sortBy: 'score'
              })
            }
            className="text-xs font-semibold text-brand-primary-orange hover:underline"
          >
            Reset Filters
          </button>
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-brand-dark-text block">Category</label>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setParams((p) => ({ ...p, category: c }))}
                className={`text-xs px-3 py-1 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                  params.category === c
                    ? 'bg-brand-primary-orange text-white'
                    : 'bg-[#FAF6F0] border border-brand-border text-brand-secondary-text hover:bg-brand-soft-orange'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pt-2">
          {/* Min Protein */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border/80">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-dark-text">Min Protein</span>
              <span className="text-emerald-700 font-mono font-extrabold">{params.minProtein}g / 100g</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={params.minProtein || 0}
              onChange={(e) => setParams((p) => ({ ...p, minProtein: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Max Sugar */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border/80">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-dark-text">Max Total Sugar</span>
              <span className="text-amber-700 font-mono font-extrabold">{params.maxSugar}g / 100g</span>
            </div>
            <input
              type="range"
              min="1"
              max="35"
              step="1"
              value={params.maxSugar || 10}
              onChange={(e) => setParams((p) => ({ ...p, maxSugar: parseFloat(e.target.value) }))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Max Sodium */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border/80">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-dark-text">Max Sodium</span>
              <span className="text-rose-700 font-mono font-extrabold">{params.maxSodium}mg</span>
            </div>
            <input
              type="range"
              min="50"
              max="1200"
              step="50"
              value={params.maxSodium || 500}
              onChange={(e) => setParams((p) => ({ ...p, maxSodium: parseFloat(e.target.value) }))}
              className="w-full accent-rose-500"
            />
          </div>

          {/* Min Fiber */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border/80">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-dark-text">Min Dietary Fiber</span>
              <span className="text-emerald-700 font-mono font-extrabold">{params.minFiber}g / 100g</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={params.minFiber || 0}
              onChange={(e) => setParams((p) => ({ ...p, minFiber: parseFloat(e.target.value) }))}
              className="w-full accent-emerald-600"
            />
          </div>

          {/* Max Calories */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border/80">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-dark-text">Max Calories</span>
              <span className="text-brand-dark-text font-mono font-extrabold">{params.maxCalories} kcal</span>
            </div>
            <input
              type="range"
              min="100"
              max="700"
              step="25"
              value={params.maxCalories || 450}
              onChange={(e) => setParams((p) => ({ ...p, maxCalories: parseFloat(e.target.value) }))}
              className="w-full accent-brand-primary-orange"
            />
          </div>

          {/* Budget */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-[#FAF6F0] border border-brand-border/80">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-brand-dark-text">Max Budget</span>
              <span className="text-brand-dark-text font-mono font-extrabold">₹{params.budget}</span>
            </div>
            <input
              type="range"
              min="20"
              max="1000"
              step="20"
              value={params.budget || 500}
              onChange={(e) => setParams((p) => ({ ...p, budget: parseFloat(e.target.value) }))}
              className="w-full accent-brand-primary-orange"
            />
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-brand-dark-text">
          Matching Products ({results.length})
        </h2>
        <span className="text-xs text-brand-secondary-text">Ranked by criteria match & compliance</span>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-brand-primary-orange animate-spin mx-auto" />
          <p className="text-xs text-brand-secondary-text font-semibold">Filtering matching products...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {results.map((res) => (
            <div key={res.product.id} className="relative flex flex-col">
              {/* Match Score Floating Badge */}
              <div className="absolute top-2 left-2 z-10 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                {res.matchScore}% Goal Fit
              </div>
              <ProductCard
                product={res.product}
                score={{ score: res.qualityScore, grade: 'A', baseScore: 5, factors: [], summary: '' }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center max-w-md mx-auto space-y-3 shadow-soft">
          <p className="text-sm font-bold text-brand-dark-text">No products matched these strict parameters</p>
          <p className="text-xs text-brand-secondary-text">
            Try relaxing your sugar limit or increasing budget allowance to view related alternatives.
          </p>
        </div>
      )}
    </div>
  );
};
