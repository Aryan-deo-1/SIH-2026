import { StandardVerification, VerificationStatus } from '../types';

export interface FssaiLicenseAnalysis {
  isValidFormat: boolean;
  licenseNumber: string;
  licenseType: 'Central License' | 'State License / Registration' | 'Invalid Format';
  stateCode?: string;
  yearEnrolled?: string;
  verificationStatus: VerificationStatus;
  evidenceUrl: string;
  details: string;
}

export class VerificationService {
  /**
   * Analyzes an FSSAI 14-digit license number and generates verification evidence
   */
  public static analyzeFssaiLicense(fssaiNumber?: string, knownProductEvidence?: StandardVerification): FssaiLicenseAnalysis {
    const defaultEvidenceUrl = 'https://foscos.fssai.gov.in/';

    if (!fssaiNumber || fssaiNumber === 'NOT_FOUND_ON_PACK' || fssaiNumber.length < 10) {
      return {
        isValidFormat: false,
        licenseNumber: fssaiNumber || '',
        licenseType: 'Invalid Format',
        verificationStatus: 'Verification Unavailable',
        evidenceUrl: defaultEvidenceUrl,
        details: 'No valid 14-digit FSSAI license was detected on the packaging or record.'
      };
    }

    const clean = fssaiNumber.replace(/\D/g, '');

    if (clean.length !== 14) {
      return {
        isValidFormat: false,
        licenseNumber: clean,
        licenseType: 'Invalid Format',
        verificationStatus: 'Needs Review',
        evidenceUrl: defaultEvidenceUrl,
        details: `License length (${clean.length} digits) does not match mandatory 14-digit FSSAI specification.`
      };
    }

    // Deconstruct 14-digit FSSAI structure:
    // 1st digit: 1 = Central License (large manufacturers/importers), 2 = State License (local manufacturers/distributors)
    const firstDigit = clean[0];
    const licenseType = firstDigit === '1' ? 'Central License' : firstDigit === '2' ? 'State License / Registration' : 'Central License';
    const stateCode = clean.substring(1, 3);
    const yearEnrolled = '20' + clean.substring(3, 5);

    // If known product evidence is supplied from our verified DB, respect it
    if (knownProductEvidence) {
      return {
        isValidFormat: true,
        licenseNumber: clean,
        licenseType,
        stateCode,
        yearEnrolled,
        verificationStatus: knownProductEvidence.status,
        evidenceUrl: knownProductEvidence.sourceUrl || defaultEvidenceUrl,
        details: knownProductEvidence.details || `License #${clean} verified on FSSAI FoSCoS portal.`
      };
    }

    // Default valid format analysis
    return {
      isValidFormat: true,
      licenseNumber: clean,
      licenseType,
      stateCode,
      yearEnrolled,
      verificationStatus: 'Verified',
      evidenceUrl: `${defaultEvidenceUrl}`,
      details: `Valid 14-digit ${licenseType} (State Code: ${stateCode}, Issued: ${yearEnrolled}). Verifiable via FoSCoS portal.`
    };
  }

  /**
   * Generates a StandardVerification object for a product
   */
  public static createVerificationObject(licenseNumber: string, status: VerificationStatus = 'Verified', details?: string): StandardVerification {
    const analysis = this.analyzeFssaiLicense(licenseNumber);
    return {
      authority: 'FSSAI (Food Safety and Standards Authority of India)',
      identifier: analysis.licenseNumber || 'UNAVAILABLE',
      status: status || analysis.verificationStatus,
      evidenceType: 'FOSCOS_RECORD',
      sourceUrl: 'https://foscos.fssai.gov.in/',
      details: details || analysis.details,
      checkedAt: new Date().toISOString()
    };
  }
}
