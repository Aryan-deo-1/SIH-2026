import { Router } from 'express';
import { CompareController } from '../controllers/compare.controller';

const router = Router();

router.post('/compare', CompareController.compare);

export default router;
