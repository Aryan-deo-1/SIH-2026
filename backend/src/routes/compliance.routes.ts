import { Router } from 'express';
import { ComplianceController } from '../controllers/compliance.controller';

const router = Router();

// Validate product data against Legal Metrology Rules, 2011
router.post('/compliance/check', ComplianceController.checkCompliance);

// Retrieve active Legal Metrology Rules
router.get('/compliance/rules', ComplianceController.getRules);

// Retrieve saved compliance result by ID
router.get('/compliance/results/:id', ComplianceController.getResultById);

// Retrieve saved compliance result by product ID
router.get('/compliance/product/:productId', ComplianceController.getResultByProductId);

export default router;
