import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';

const router = Router();

router.get('/products', ProductController.getAllProducts);
router.get('/products/:id', ProductController.getProduct);
router.get('/products/:id/nutrition', ProductController.getNutrition);
router.get('/products/:id/warnings', ProductController.getWarnings);
router.get('/products/:id/positives', ProductController.getPositives);
router.get('/products/:id/compliance', ProductController.getCompliance);
router.get('/products/:id/verification', ProductController.getVerification);
router.get('/products/:id/recommendations', ProductController.getRecommendations);

export default router;
