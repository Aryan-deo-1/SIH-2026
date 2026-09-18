import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import {
  Camera,
  Upload,
  ScanLine,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers
} from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onImageSelected: (file: File) => void;
  isLoading?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  onImageSelected,
  isLoading
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Sample quick barcodes for instant testing
  const demoBarcodes = [
    { name: 'Lays Classic Salted', barcode: '8901491101837', tag: 'Chips' },
    { name: 'Pintola Peanut Butter', barcode: '8906079970119', tag: 'High Protein' },
    { name: 'Britannia NutriChoice', barcode: '8901063013825', tag: 'Digestive' },
    { name: 'Maggi 2-Min Noodles', barcode: '8901058852309', tag: 'Instant Food' },
    { name: 'Quaker Rolled Oats', barcode: '8901491500012', tag: 'Cereal' },
    { name: 'Slurrp Farm Millet Noodles', barcode: '8906114251020', tag: 'Alternative' }
  ];

  // Start ZXing Camera Scanner
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      setCameraActive(true);
      if (videoRef.current) {
        await codeReaderRef.current.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result, error) => {
            if (result) {
              const text = result.getText();
              console.log('[Scanner] ZXing detected barcode:', text);
              stopCamera();
              onBarcodeDetected(text);
            }
          }
        );
      }
    } catch (err: any) {
      console.warn('[Scanner] Camera error:', err);
      setCameraError('Camera access not available or permission denied. Please upload an image or select a sample barcode below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (codeReaderRef.current) {
      try {
        // Stop continuous decode by releasing media stream
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoRef.current.srcObject = null;
        }
      } catch (e) {
        // ignore cleanup error
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onImageSelected(file);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-brand-border shadow-soft p-5 md:p-6 space-y-5">
      {/* Mode Tabs */}
      <div className="flex rounded-2xl bg-[#FAF6F0] p-1 border border-brand-border/60">
        <button
          type="button"
          onClick={() => {
            setActiveTab('camera');
            setCameraError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'camera'
              ? 'bg-white text-brand-primary-orange shadow-xs border border-brand-border'
              : 'text-brand-secondary-text hover:text-brand-dark-text'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Camera Scanner</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('upload');
            stopCamera();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeTab === 'upload'
              ? 'bg-white text-brand-primary-orange shadow-xs border border-brand-border'
              : 'text-brand-secondary-text hover:text-brand-dark-text'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Image / Label</span>
        </button>
      </div>

      {/* Camera Scanner View */}
      {activeTab === 'camera' && (
        <div className="space-y-4">
          <div className="relative w-full aspect-4/3 sm:aspect-16/9 bg-black rounded-2xl overflow-hidden flex items-center justify-center border-2 border-brand-light-orange shadow-inner">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Target Laser Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                <div className="relative w-4/5 sm:w-2/3 h-2/3 border-2 border-dashed border-brand-primary-orange/80 rounded-2xl flex items-center justify-center bg-brand-primary-orange/5">
                  {/* Scanning Laser Beam */}
                  <div className="absolute left-2 right-2 h-0.5 bg-brand-primary-orange shadow-[0_0_8px_#F59E0B] animate-scan-line"></div>
                  <span className="text-[11px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs">
                    Align Barcode or QR within frame
                  </span>
                </div>
              </div>
            )}

            {!cameraActive && (
              <div className="text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-brand-primary-orange flex items-center justify-center mx-auto backdrop-blur-xs">
                  <ScanLine className="w-8 h-8" />
                </div>
                <p className="text-xs sm:text-sm text-gray-300 max-w-sm mx-auto">
                  Click below to activate live camera feed for instant barcode, EAN-13, and package text detection.
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isLoading}
                  className="bg-brand-primary-orange hover:bg-brand-hover-orange text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
                >
                  {isLoading ? 'Processing...' : 'Start Camera Scanner'}
                </button>
              </div>
            )}
          </div>

          {cameraActive && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={stopCamera}
                className="text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-1.5 rounded-xl font-semibold transition-colors"
              >
                Stop Camera
              </button>
            </div>
          )}

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>
      )}

      {/* Image Upload View */}
      {activeTab === 'upload' && (
        <div className="space-y-4">
          <label className="border-2 border-dashed border-brand-border hover:border-brand-primary-orange rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#FAF6F0]/50 hover:bg-brand-soft-orange/30 transition-all text-center">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Selected package"
                  className="max-h-56 mx-auto rounded-xl object-contain border border-brand-border shadow-xs"
                />
                <span className="text-xs font-semibold text-brand-primary-orange block">
                  Click to choose a different image
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft-orange text-brand-primary-orange flex items-center justify-center mx-auto">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-heading text-sm font-bold text-brand-dark-text block">
                    Upload Package or Nutrition Label
                  </span>
                  <span className="text-xs text-brand-secondary-text">
                    JPEG, PNG, or WEBP (Front, Back, Nutrition facts table, or FSSAI number)
                  </span>
                </div>
                <span className="inline-block bg-white border border-brand-border text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs">
                  Browse Device Files
                </span>
              </div>
            )}
          </label>
        </div>
      )}

      {/* Manual Barcode Input */}
      <div className="pt-2 border-t border-brand-border/60 space-y-2">
        <label className="block text-xs font-bold text-brand-dark-text">
          Enter Barcode Number Directly:
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (manualBarcode.trim()) {
              onBarcodeDetected(manualBarcode.trim());
            }
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="e.g. 8901491101837 (Lays) or any EAN-13/GTIN..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF6F0] border border-brand-border text-xs focus:border-brand-primary-orange focus:bg-white outline-none transition-all font-mono"
          />
          <button
            type="submit"
            disabled={!manualBarcode.trim() || isLoading}
            className="bg-brand-primary-orange hover:bg-brand-hover-orange disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            {isLoading ? 'Checking...' : 'Verify Barcode'}
          </button>
        </form>
      </div>

      {/* Instant Demo Barcode Selector */}
      <div className="pt-2 border-t border-brand-border/60">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-brand-dark-text flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Or test with verified demo products:</span>
          </span>
          <span className="text-[10px] text-brand-secondary-text">1-Click simulation</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {demoBarcodes.map((item) => (
            <button
              key={item.barcode}
              type="button"
              onClick={() => onBarcodeDetected(item.barcode)}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-brand-border hover:border-brand-primary-orange bg-[#FAF6F0] hover:bg-brand-soft-orange text-left transition-all group"
            >
              <span className="text-[10px] uppercase font-bold text-brand-primary-orange block">
                {item.tag}
              </span>
              <span className="font-heading text-xs font-bold text-brand-dark-text block truncate group-hover:text-brand-primary-orange">
                {item.name}
              </span>
              <span className="text-[10px] font-mono text-brand-secondary-text block mt-0.5">
                {item.barcode}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
