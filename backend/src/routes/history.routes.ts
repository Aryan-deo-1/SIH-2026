import { Router } from 'express';
import { HistoryController } from '../controllers/history.controller';

const router = Router();

router.get('/history', HistoryController.getHistory);
router.delete('/history', HistoryController.clearHistory);

export default router;
