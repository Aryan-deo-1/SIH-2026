import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ScanLine,
  Search,
  Salad,
  ShieldCheck,
  Award,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  FileSearch,
  Scale
} from 'lucide-react';
import { api } from '../services/api';
import { StandardProduct } from '../types';
import { ProductCard } from '../components/ProductCard';

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<StandardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const list = await api.getProducts();
        setFeaturedProducts(list.slice(0, 4));
      } catch (err) {
        console.error('Failed to load featured products', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  const featureCards = [
    {
      icon: ScanLine,
      title: 'Barcode & QR ID',
      desc: 'Instant GS1, EAN-13, and UPC packaging detection with automatic registry synchronization.'
    },
    {
      icon: FileSearch,
      title: 'Tesseract OCR Scan',
      desc: 'Extract and parse nutrition tables, mandatory FSSAI declarations, and ingredient text directly from photos.'
    },
    {
      icon: Award,
      title: 'Deterministic 0–5 Score',
      desc: 'Zero-hallucination nutritional quality index based strictly on declared macros and ICMR dietary guidance.'
    },
    {
      icon: ShieldCheck,
      title: 'FSSAI License Evidence',
      desc: 'Separate verification subsystem cross-referencing 14-digit manufacturing licenses with FoSCoS portal.'
    },
    {
      icon: Sparkles,
      title: 'Smart Recommendations',
      desc: 'Discovers healthier, lower-sodium, and high-protein alternatives matching your exact dietary preferences.'
    }
  ];

  return (
    <div className="space-y-16 py-6 md:py-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-brand-soft-orange via-brand-soft-orange/60 to-white border border-brand-border p-6 sm:p-12 lg:p-16 text-center shadow-soft">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-xs border border-brand-light-orange px-3.5 py-1.5 rounded-full text-xs font-bold text-brand-primary-orange shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan. Verify. Understand. Choose Better.</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-dark-text tracking-tight leading-tight">
            Know What <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary-orange via-amber-500 to-brand-warning">
              You Buy.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-brand-secondary-text max-w-2xl mx-auto leading-relaxed">
            Scan a packaged food product to decode its nutritional facts, inspect verified FSSAI licensing evidence, flag hidden additives, and discover better alternatives.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/scan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-brand-primary-orange hover:bg-brand-hover-orange text-white px-7 py-3.5 rounded-2xl text-sm font-bold shadow-soft hover:shadow-soft-hover transition-all active:scale-95"
            >
              <ScanLine className="w-5 h-5" />
              <span>Scan Product Now</span>
            </Link>

            <Link
              to="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-brand-soft-orange text-brand-dark-text px-6 py-3.5 rounded-2xl text-sm font-bold border border-brand-border shadow-xs transition-all"
            >
              <Search className="w-4 h-4 text-brand-primary-orange" />
              <span>Search Database</span>
            </Link>

            <Link
              to="/diet"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-brand-soft-orange text-brand-dark-text px-6 py-3.5 rounded-2xl text-sm font-bold border border-brand-border shadow-xs transition-all"
            >
              <Salad className="w-4 h-4 text-emerald-600" />
              <span>Diet Finder</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Strip */}
        <div className="mt-12 pt-8 border-t border-brand-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="font-heading text-2xl font-extrabold text-brand-dark-text block">100%</span>
            <span className="text-xs text-brand-secondary-text">TypeScript & Node.js</span>
          </div>
          <div>
            <span className="font-heading text-2xl font-extrabold text-brand-dark-text block">0–5.0</span>
            <span className="text-xs text-brand-secondary-text">Deterministic Score</span>
          </div>
          <div>
            <span className="font-heading text-2xl font-extrabold text-brand-dark-text block">FSSAI FoSCoS</span>
            <span className="text-xs text-brand-secondary-text">Official Verification</span>
          </div>
          <div>
            <span className="font-heading text-2xl font-extrabold text-brand-dark-text block">3M+ Products</span>
            <span className="text-xs text-brand-secondary-text">Internal + Registry Cache</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
            Engineered for Transparency
          </h2>
          <p className="text-xs sm:text-sm text-brand-secondary-text">
            No vague claims or invented data. Every score, warning, and recommendation is anchored in official records and declared numbers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft hover:shadow-soft-hover transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-soft-orange text-brand-primary-orange flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-sm font-bold text-brand-dark-text">{feat.title}</h3>
                <p className="text-xs text-brand-secondary-text leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Verified Products Showcase */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-brand-dark-text">
              Popular Packaged Commodities
            </h2>
            <p className="text-xs text-brand-secondary-text">
              Sample verified products available for instant compliance analysis
            </p>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary-orange hover:text-brand-hover-orange"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* How it Works Banner */}
      <section className="bg-white rounded-3xl border border-brand-border p-8 sm:p-10 shadow-soft">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary-orange bg-brand-soft-orange px-2.5 py-0.5 rounded-full border border-brand-light-orange">
              Workflow Pipeline
            </span>
            <h2 className="font-heading text-2xl font-extrabold text-brand-dark-text">
              How PackCheck Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="space-y-2 text-center sm:text-left">
              <span className="w-8 h-8 rounded-xl bg-brand-soft-orange text-brand-primary-orange font-heading font-extrabold flex items-center justify-center text-sm border border-brand-light-orange">
                1
              </span>
              <h4 className="font-heading text-sm font-bold text-brand-dark-text">Scan or Search</h4>
              <p className="text-xs text-brand-secondary-text leading-relaxed">
                Use your camera or upload a package photo to capture barcode, OCR text, and FSSAI license numbers.
              </p>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <span className="w-8 h-8 rounded-xl bg-brand-soft-orange text-brand-primary-orange font-heading font-extrabold flex items-center justify-center text-sm border border-brand-light-orange">
                2
              </span>
              <h4 className="font-heading text-sm font-bold text-brand-dark-text">Multi-Tier Resolution</h4>
              <p className="text-xs text-brand-secondary-text leading-relaxed">
                PackCheck checks internal PostgreSQL, falls back to OpenFoodFacts registry, normalizes, and runs compliance rules.
              </p>
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <span className="w-8 h-8 rounded-xl bg-brand-soft-orange text-brand-primary-orange font-heading font-extrabold flex items-center justify-center text-sm border border-brand-light-orange">
                3
              </span>
              <h4 className="font-heading text-sm font-bold text-brand-dark-text">Understand & Upgrade</h4>
              <p className="text-xs text-brand-secondary-text leading-relaxed">
                Review deterministic 0–5 quality score, inspect warnings, and discover lower-sugar, high-protein alternatives.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
