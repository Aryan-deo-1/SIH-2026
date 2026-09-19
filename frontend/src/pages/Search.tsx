import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { StandardProduct } from '../types';
import { Search as SearchIcon, Filter, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const Search: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [results, setResults] = useState<{ product: StandardProduct; score?: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);

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

  const performSearch = async (searchTerm: string, cat: string) => {
    setLoading(true);
    setSourceNotice(null);
    try {
      const res = await api.searchManual(searchTerm, cat);
      if (res && res.data && Array.isArray(res.data)) {
        setResults(res.data);
        if (res.source === 'EXTERNAL_API') {
          setSourceNotice('Item was discovered via external OpenFoodFacts global registry and cached.');
        }
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Search failed', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query, selectedCategory);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      {/* Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
          Search Products
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary-text">
          Query internal verified commodities or search 3M+ packaged foods via external registry sync.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="max-w-2xl mx-auto relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name, brand (e.g. Lays, Pintola, Maggi) or barcode..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-brand-border focus:border-brand-primary-orange focus:ring-2 focus:ring-brand-primary-orange/20 text-sm shadow-soft outline-none transition-all placeholder:text-brand-secondary-text/70"
          />
          <SearchIcon className="w-5 h-5 text-brand-secondary-text absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none max-w-5xl mx-auto px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-brand-primary-orange text-white shadow-xs'
                : 'bg-white border border-brand-border text-brand-secondary-text hover:text-brand-dark-text hover:bg-brand-soft-orange'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* External Registry Notice */}
      {sourceNotice && (
        <div className="max-w-xl mx-auto bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-2xl flex items-center gap-2 shadow-xs">
          <Sparkles className="w-4 h-4 text-brand-primary-orange shrink-0" />
          <span>{sourceNotice}</span>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="py-16 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-brand-primary-orange animate-spin mx-auto" />
          <p className="text-xs font-semibold text-brand-secondary-text">Searching database and registries...</p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
          {results.map((item) => (
            <ProductCard
              key={item.product.id}
              product={item.product}
              score={item.score}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-brand-border p-12 text-center max-w-md mx-auto space-y-3 shadow-soft">
          <Layers className="w-10 h-10 text-brand-secondary-text/60 mx-auto" />
          <h3 className="font-heading text-base font-bold text-brand-dark-text">No Products Found</h3>
          <p className="text-xs text-brand-secondary-text">
            {query.trim() ? (
              <>We couldn't locate matching items for "{query}". Check spelling or try scanning the package directly.</>
            ) : (
              <>No products found for this filter. Try selecting another category or typing a search query.</>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
