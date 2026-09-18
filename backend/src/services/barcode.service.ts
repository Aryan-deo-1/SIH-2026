export interface BarcodeValidationResult {
  raw: string;
  normalized: string;
  format: 'EAN-13' | 'UPC-A' | 'GTIN-14' | 'QR' | 'UNKNOWN';
  isValid: boolean;
  countryCode?: string;
  notes?: string;
}

export class BarcodeService {
  /**
   * Cleans, classifies, and checks standard GTIN checksum for barcodes
   */
  public static validateAndNormalize(rawInput: string): BarcodeValidationResult {
    const cleaned = (rawInput || '').replace(/[^0-9A-Za-z]/g, '').trim();

    if (!cleaned) {
      return {
        raw: rawInput,
        normalized: '',
        format: 'UNKNOWN',
        isValid: false,
        notes: 'Empty or invalid barcode string'
      };
    }

    // Pure numeric barcodes
    if (/^\d+$/.test(cleaned)) {
      if (cleaned.length === 13) {
        const isValid = this.verifyGtinChecksum(cleaned);
        const country = cleaned.startsWith('890') ? 'India (GS1 India 890)' : 'International';
        return {
          raw: rawInput,
          normalized: cleaned,
          format: 'EAN-13',
          isValid,
          countryCode: country,
          notes: isValid ? `Valid EAN-13 (${country})` : 'Checksum mismatch'
        };
      }

      if (cleaned.length === 12) {
        const isValid = this.verifyGtinChecksum('0' + cleaned);
        return {
          raw: rawInput,
          normalized: cleaned,
          format: 'UPC-A',
          isValid,
          countryCode: 'North America',
          notes: isValid ? 'Valid UPC-A' : 'Checksum mismatch'
        };
      }

      if (cleaned.length === 14) {
        const isValid = this.verifyGtinChecksum(cleaned);
        return {
          raw: rawInput,
          normalized: cleaned,
          format: 'GTIN-14',
          isValid,
          notes: isValid ? 'Valid GTIN-14 case code' : 'Checksum mismatch'
        };
      }
    }

    // QR or alphanumeric
    return {
      raw: rawInput,
      normalized: cleaned,
      format: 'QR',
      isValid: cleaned.length >= 4,
      notes: 'Alphanumeric or QR identifier'
    };
  }

  /**
   * Computes standard Modulo-10 GTIN checksum algorithm
   */
  private static verifyGtinChecksum(code: string): boolean {
    if (code.length < 2) return false;
    const digits = code.split('').map(Number);
    const checkDigit = digits[digits.length - 1];
    let sum = 0;

    // From right to left (excluding check digit), alternating weights 3 and 1
    let weight = 3;
    for (let i = digits.length - 2; i >= 0; i--) {
      sum += digits[i] * weight;
      weight = weight === 3 ? 1 : 3;
    }

    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }
}
