import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();

router.get('/admin/stats', AdminController.getStats);
router.post('/admin/products', AdminController.createProduct);
router.get('/admin/rules', AdminController.getRules);

export default router;
