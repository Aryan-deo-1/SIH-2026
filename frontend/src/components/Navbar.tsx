import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  ScanLine,
  Search,
  Salad,
  History,
  Menu,
  X,
  Sparkles,
  SlidersHorizontal,
  Settings,
  Scale,
  Download
} from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();

  const navLinks = [
    { name: 'Home', path: '/', icon: ShieldCheck },
    { name: 'Scan', path: '/scan', icon: ScanLine, highlight: true },
    { name: 'Search', path: '/search', icon: Search },
    { name: 'Diet Finder', path: '/diet', icon: Salad },
    { name: 'Compare', path: '/compare', icon: Scale },
    { name: 'History', path: '/history', icon: History },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop & Tablet Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary-orange to-brand-warning flex items-center justify-center shadow-soft text-white transition-transform group-hover:scale-105">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-heading text-xl font-extrabold tracking-tight text-brand-dark-text">
                  Pack<span className="text-brand-primary-orange">Check</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider font-semibold text-brand-secondary-text bg-brand-soft-orange px-1.5 py-0.5 rounded ml-2 border border-brand-light-orange">
                  Compliance MVP
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-soft-orange text-brand-primary-orange font-semibold border border-brand-light-orange shadow-sm'
                        : 'text-brand-dark-text hover:bg-brand-soft-orange/60 hover:text-brand-primary-orange'
                    } ${link.highlight ? 'ring-1 ring-brand-primary-orange/30' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-brand-primary-orange' : 'text-brand-secondary-text'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                to="/preferences"
                title="User Preferences"
                className={`p-2 rounded-xl border border-brand-border text-brand-secondary-text hover:text-brand-primary-orange hover:bg-brand-soft-orange transition-colors ${
                  isActive('/preferences') ? 'bg-brand-soft-orange text-brand-primary-orange' : ''
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Link>
              <Link
                to="/admin"
                title="Admin Panel"
                className={`p-2 rounded-xl border border-brand-border text-brand-secondary-text hover:text-brand-primary-orange hover:bg-brand-soft-orange transition-colors ${
                  isActive('/admin') ? 'bg-brand-soft-orange text-brand-primary-orange' : ''
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>
              {(isInstallable || (isIOS && !isInstalled)) && (
                <button
                  type="button"
                  onClick={installApp}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  title="Install PackCheck App"
                  aria-label="Install PackCheck App"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}
              <Link
                to="/scan"
                className="flex items-center gap-2 bg-brand-primary-orange hover:bg-brand-hover-orange text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-soft hover:shadow-soft-hover transition-all active:scale-95"
              >
                <ScanLine className="w-4 h-4" />
                <span>Scan Product</span>
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              {(isInstallable || (isIOS && !isInstalled)) && (
                <button
                  type="button"
                  onClick={installApp}
                  className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs"
                  title="Install PackCheck"
                  aria-label="Install App"
                >
                  <Download className="w-3.5 h-3.5 text-brand-primary-orange" />
                  <span>Install</span>
                </button>
              )}
              <Link
                to="/scan"
                className="flex items-center gap-1.5 bg-brand-primary-orange text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm"
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>Scan</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-brand-secondary-text hover:bg-brand-soft-orange focus:outline-none"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-brand-border bg-white px-4 pt-2 pb-4 space-y-1 shadow-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                    active
                      ? 'bg-brand-soft-orange text-brand-primary-orange font-semibold'
                      : 'text-brand-dark-text hover:bg-brand-soft-orange/50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-brand-primary-orange" />
                  {link.name}
                </Link>
              );
            })}
            {(isInstallable || (isIOS && !isInstalled)) && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  installApp();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-amber-50 to-amber-100/80 text-amber-900 border border-amber-300 my-1"
              >
                <Download className="w-4 h-4 text-brand-primary-orange" />
                <span>Install PackCheck Mobile App</span>
              </button>
            )}
            <div className="pt-2 border-t border-brand-border/60 flex items-center justify-around">
              <Link
                to="/preferences"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-brand-secondary-text hover:text-brand-primary-orange py-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Preferences</span>
              </Link>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-brand-secondary-text hover:text-brand-primary-orange py-2"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Sticky Bottom Navigation Bar for High-Frequency Actions */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-brand-border px-2 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        <div className="grid grid-cols-5 items-center justify-around text-center">
          <Link
            to="/"
            className={`flex flex-col items-center py-1 text-[11px] font-medium transition-colors ${
              isActive('/') ? 'text-brand-primary-orange font-semibold' : 'text-brand-secondary-text'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>Home</span>
          </Link>

          <Link
            to="/search"
            className={`flex flex-col items-center py-1 text-[11px] font-medium transition-colors ${
              isActive('/search') ? 'text-brand-primary-orange font-semibold' : 'text-brand-secondary-text'
            }`}
          >
            <Search className="w-5 h-5 mb-0.5" />
            <span>Search</span>
          </Link>

          {/* Center Scan Button with Elevated Floating Pill */}
          <Link
            to="/scan"
            className="flex flex-col items-center -mt-5 relative group"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-brand-primary-orange to-brand-warning text-white flex items-center justify-center shadow-lg border-2 border-white transform transition-transform active:scale-90">
              <ScanLine className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-brand-primary-orange mt-1">Scan</span>
          </Link>

          <Link
            to="/diet"
            className={`flex flex-col items-center py-1 text-[11px] font-medium transition-colors ${
              isActive('/diet') ? 'text-brand-primary-orange font-semibold' : 'text-brand-secondary-text'
            }`}
          >
            <Salad className="w-5 h-5 mb-0.5" />
            <span>Diet</span>
          </Link>

          <Link
            to="/history"
            className={`flex flex-col items-center py-1 text-[11px] font-medium transition-colors ${
              isActive('/history') ? 'text-brand-primary-orange font-semibold' : 'text-brand-secondary-text'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span>History</span>
          </Link>
        </div>
      </nav>
    </>
  );
};
