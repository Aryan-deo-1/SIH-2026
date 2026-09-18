import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner } from '../components/BarcodeScanner';
import { api } from '../services/api';
import { ProcessingAnimation } from '../components/ProcessingAnimation';
import { AlertCircle, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBarcodeDetected = async (barcode: string) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Pass barcode to backend scan endpoint
      const formData = new FormData();
      formData.append('barcode', barcode);

      const result = await api.scan(formData);
      if (result && result.product) {
        navigate(`/product/${result.product.id}`, { state: { scanResult: result } });
      } else {
        setErrorMessage(`Product with barcode "${barcode}" could not be resolved.`);
      }
    } catch (err: any) {
      console.error('Scan failed', err);
      const msg = err.response?.data?.error?.message || err.message || 'Error processing product scan';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelected = async (file: File) => {
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await api.scan(formData);
      if (result && result.product) {
        navigate(`/product/${result.product.id}`, { state: { scanResult: result } });
      } else {
        setErrorMessage('We could not identify the product from this label. Please try searching manually or take a clearer photo.');
      }
    } catch (err: any) {
      console.error('Image scan failed', err);
      const msg = err.response?.data?.error?.message || err.message || 'Error extracting label information';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-dark-text">
          Package Scanner
        </h1>
        <p className="text-xs sm:text-sm text-brand-secondary-text max-w-md mx-auto">
          Scan any barcode, EAN-13, or upload a product front/nutrition label to run instant compliance verification.
        </p>
      </div>

      {/* Error notification / 404 Not Found Card */}
      {errorMessage && (
        <div className="bg-amber-50/90 border border-amber-200 p-5 rounded-3xl text-amber-900 shadow-soft space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-heading text-sm font-bold text-amber-950">
                Product Not Found in Database or Open Food Facts
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed">
                {errorMessage}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/60 text-xs">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                navigate('/search');
              }}
              className="bg-brand-primary-orange hover:bg-brand-hover-orange text-white font-bold px-3.5 py-1.5 rounded-xl transition-colors shadow-xs"
            >
              Search by Brand / Name Instead
            </button>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="bg-white border border-brand-border text-brand-dark-text font-semibold px-3 py-1.5 rounded-xl hover:bg-amber-100/50 transition-colors"
            >
              Dismiss & Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Scanner Container or Processing Animation */}
      {isProcessing ? (
        <ProcessingAnimation />
      ) : (
        <BarcodeScanner
          onBarcodeDetected={handleBarcodeDetected}
          onImageSelected={handleImageSelected}
          isLoading={isProcessing}
        />
      )}

      {/* Helpful Tips Card */}
      <div className="bg-white rounded-2xl border border-brand-border p-4 shadow-xs text-xs text-brand-secondary-text space-y-2">
        <div className="flex items-center gap-2 text-brand-dark-text font-bold">
          <HelpCircle className="w-4 h-4 text-brand-primary-orange" />
          <span>Tips for Best Scanning Accuracy</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed">
          <li>Ensure good lighting without harsh glare across shiny plastic wrappers.</li>
          <li>For OCR text extraction, frame the nutrition table or 14-digit FSSAI number squarely.</li>
          <li>If the barcode is smudged, select one of our verified demo items or search by brand name.</li>
        </ul>
      </div>
    </div>
  );
};
