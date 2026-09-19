import React from 'react';
import { X, Share, PlusSquare, Smartphone, Check } from 'lucide-react';
import { usePWA } from '../context/PWAContext';

export const InstallModal: React.FC = () => {
  const { showIOSGuide, setShowIOSGuide } = usePWA();

  if (!showIOSGuide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[#FFFDFB] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-brand-border relative transform transition-all">
        {/* Close Button */}
        <button
          onClick={() => setShowIOSGuide(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-brand-soft-orange transition-colors"
          aria-label="Close guide"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-primary-orange to-brand-warning flex items-center justify-center text-white shadow-soft">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-brand-dark-text">
              Install PackCheck on iOS
            </h3>
            <p className="text-xs text-brand-secondary-text">
              Add to your iPhone or iPad home screen
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3.5 my-5 text-sm text-brand-dark-text">
          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-brand-soft-orange/60 border border-brand-light-orange/50">
            <div className="w-7 h-7 rounded-lg bg-white text-brand-primary-orange flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs sm:text-sm">
              Tap the <strong className="font-semibold inline-flex items-center gap-1 mx-1 text-blue-600"><Share className="w-3.5 h-3.5" /> Share</strong> button in Safari's bottom toolbar.
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-brand-soft-orange/60 border border-brand-light-orange/50">
            <div className="w-7 h-7 rounded-lg bg-white text-brand-primary-orange flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs sm:text-sm">
              Scroll down the menu and tap <strong className="font-semibold inline-flex items-center gap-1 mx-1 text-gray-900"><PlusSquare className="w-3.5 h-3.5" /> Add to Home Screen</strong>.
            </div>
          </div>

          <div className="flex items-start gap-3 p-2.5 rounded-xl bg-brand-soft-orange/60 border border-brand-light-orange/50">
            <div className="w-7 h-7 rounded-lg bg-white text-brand-primary-orange flex items-center justify-center font-bold text-xs shadow-xs shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs sm:text-sm">
              Tap <strong className="font-semibold text-brand-primary-orange">Add</strong> in the top right corner. PackCheck is now installed!
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={() => setShowIOSGuide(false)}
          className="w-full bg-brand-primary-orange hover:bg-brand-hover-orange text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-soft"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
