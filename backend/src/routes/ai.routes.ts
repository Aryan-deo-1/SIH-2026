import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';

const router = Router();

// Main AI chat endpoint
router.post('/ai/chat', AIController.chat);

// Quick product context summary for AI
router.get('/ai/context/:productId', AIController.getProductContext);

// Deterministic nutrition targets calculation
router.post('/ai/calculate-nutrition', AIController.calculateNutrition);

export default router;
