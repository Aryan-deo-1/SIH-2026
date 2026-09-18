import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();

router.post('/search/manual', SearchController.manualSearch);
router.post('/search/diet', SearchController.dietSearch);

export default router;
