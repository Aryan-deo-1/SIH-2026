import { describe, it, expect } from 'vitest';
import { BarcodeService } from '../src/services/barcode.service';

describe('BarcodeService', () => {
  it('should validate and classify 13-digit EAN correctly', () => {
    // 8901491101837 is Lays Indian barcode
    const res = BarcodeService.validateAndNormalize('8901491101837');
    expect(res.format).toBe('EAN-13');
    expect(res.isValid).toBe(true);
    expect(res.countryCode).toContain('India');
  });

  it('should handle alphanumeric QR code', () => {
    const res = BarcodeService.validateAndNormalize('QR_PRODUCT_ALPHA_99');
    expect(res.format).toBe('QR');
    expect(res.isValid).toBe(true);
  });
});
