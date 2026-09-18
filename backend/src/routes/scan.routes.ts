import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Main Scan: accepts barcode and/or image upload (front, back, nutrition label)
router.post('/scan', upload.any(), ScanController.scan);

// Dedicated OCR test endpoint
router.post('/ocr', upload.single('image'), ScanController.runOcr);

// Dedicated Barcode lookup endpoint
router.post('/barcode/lookup', ScanController.lookupBarcode);

export default router;
