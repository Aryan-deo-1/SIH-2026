import React from 'react';
import { LegalMetrologyExtractedFields } from '../types';
import {
  PackageCheck,
  Building2,
  Calendar,
  IndianRupee,
  PhoneCall,
  Mail,
  MapPin,
  Globe,
  Tag,
  Boxes,
  HelpCircle
} from 'lucide-react';

interface Props {
  declarations?: LegalMetrologyExtractedFields;
}

export const ExtractedDeclarationsCard: React.FC<Props> = ({ declarations }) => {
  if (!declarations) return null;

  const {
    commodityName,
    productName,
    brand,
    manufacturer,
    manufacturerAddress,
    packer,
    packerAddress,
    importer,
    importerAddress,
    netQuantity,
    normalizedQuantityValue,
    normalizedQuantityUnit,
    count,
    mrp,
    unitSalePrice,
    manufacturingDate,
    packingDate,
    importDate,
    normalizedDate,
    consumerCarePhone,
    consumerCareEmail,
    consumerCareAddress,
    countryOfOrigin,
    dimensions
  } = declarations;

  return (
    <div className="bg-white rounded-3xl border border-brand-border p-5 sm:p-7 shadow-soft space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-soft-orange flex items-center justify-center text-brand-primary-orange">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-brand-dark-text">
              Extracted Package Information
            </h3>
            <p className="text-[11px] text-brand-secondary-text">
              Normalized declarations parsed from label OCR evidence
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
        {/* Commodity / Product Name */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <Tag className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Commodity & Brand</span>
          </div>
          <div className="space-y-0.5">
            <span className="font-heading text-sm font-extrabold text-brand-dark-text block">
              {commodityName || productName || 'Not Detected'}
            </span>
            {brand && (
              <span className="text-[11px] text-brand-secondary-text block">
                Brand: <strong className="text-brand-dark-text">{brand}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Net Quantity */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <Boxes className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Declared Net Quantity</span>
          </div>
          <div className="space-y-0.5">
            <span className="font-heading text-base font-extrabold text-brand-dark-text block">
              {netQuantity || 'Not Detected'}
            </span>
            {count && (
              <span className="text-[11px] text-brand-secondary-text block">
                Units / Count: <strong className="text-brand-dark-text">{count} N</strong>
              </span>
            )}
          </div>
        </div>

        {/* MRP & USP */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <IndianRupee className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Retail Sale Price (MRP)</span>
          </div>
          <div className="space-y-0.5">
            <span className="font-heading text-base font-extrabold text-brand-dark-text block">
              {mrp || 'Not Detected'}
            </span>
            <span className="text-[10px] text-brand-secondary-text block">
              {unitSalePrice ? `USP: ${unitSalePrice}` : 'Incl. of all taxes'}
            </span>
          </div>
        </div>

        {/* Manufacturer / Packer / Importer */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5 md:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <Building2 className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Manufacturer / Packer / Importer</span>
          </div>
          <div className="space-y-1 text-xs">
            {manufacturer && (
              <div>
                <span className="font-semibold text-brand-dark-text">Mfg: {manufacturer}</span>
                {manufacturerAddress && (
                  <p className="text-[11px] text-brand-secondary-text leading-relaxed mt-0.5">
                    {manufacturerAddress}
                  </p>
                )}
              </div>
            )}
            {packer && (
              <div className="pt-1 border-t border-brand-border/40">
                <span className="font-semibold text-brand-dark-text">Packed by: {packer}</span>
                {packerAddress && (
                  <p className="text-[11px] text-brand-secondary-text leading-relaxed mt-0.5">
                    {packerAddress}
                  </p>
                )}
              </div>
            )}
            {importer && (
              <div className="pt-1 border-t border-brand-border/40">
                <span className="font-semibold text-brand-dark-text">Imported by: {importer}</span>
                {importerAddress && (
                  <p className="text-[11px] text-brand-secondary-text leading-relaxed mt-0.5">
                    {importerAddress}
                  </p>
                )}
              </div>
            )}
            {!manufacturer && !packer && !importer && (
              <span className="text-slate-400 italic">No manufacturer declaration detected</span>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Date of Packing / Mfg</span>
          </div>
          <div className="space-y-1 text-xs">
            {manufacturingDate && (
              <div className="flex justify-between">
                <span className="text-brand-secondary-text">MFD:</span>
                <span className="font-bold text-brand-dark-text">{manufacturingDate}</span>
              </div>
            )}
            {packingDate && (
              <div className="flex justify-between">
                <span className="text-brand-secondary-text">PKD:</span>
                <span className="font-bold text-brand-dark-text">{packingDate}</span>
              </div>
            )}
            {importDate && (
              <div className="flex justify-between">
                <span className="text-brand-secondary-text">Import:</span>
                <span className="font-bold text-brand-dark-text">{importDate}</span>
              </div>
            )}
            {!manufacturingDate && !packingDate && !importDate && (
              <span className="text-slate-400 italic">Date declaration not found</span>
            )}
          </div>
        </div>

        {/* Consumer Care */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5 md:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <PhoneCall className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Consumer Grievance / Care Redressal</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
            {consumerCarePhone && (
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3 h-3 text-brand-secondary-text" />
                <span className="font-semibold text-brand-dark-text">{consumerCarePhone}</span>
              </div>
            )}
            {consumerCareEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-brand-secondary-text" />
                <span className="font-mono text-[11px] text-brand-dark-text">{consumerCareEmail}</span>
              </div>
            )}
            {consumerCareAddress && (
              <div className="sm:col-span-2 flex items-start gap-1.5 text-[11px] text-brand-secondary-text">
                <MapPin className="w-3 h-3 text-brand-secondary-text shrink-0 mt-0.5" />
                <span>{consumerCareAddress}</span>
              </div>
            )}
            {!consumerCarePhone && !consumerCareEmail && !consumerCareAddress && (
              <span className="text-slate-400 italic">No consumer care details detected</span>
            )}
          </div>
        </div>

        {/* Country of Origin & Dimensions */}
        <div className="bg-[#FFFDFB] border border-brand-border rounded-2xl p-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-brand-secondary-text font-bold text-[11px]">
            <Globe className="w-3.5 h-3.5 text-brand-primary-orange" />
            <span>Origin & Dimensions</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-brand-secondary-text">Origin:</span>
              <span className="font-bold text-brand-dark-text">{countryOfOrigin || 'India'}</span>
            </div>
            {dimensions && (
              <div className="flex justify-between">
                <span className="text-brand-secondary-text">Dimensions:</span>
                <span className="font-mono text-brand-dark-text">{dimensions}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
