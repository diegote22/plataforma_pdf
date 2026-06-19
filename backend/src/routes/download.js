import { Router } from 'express';
import { getDownloads } from '../controllers/downloadController.js';
import { downloadLimiter } from '../middlewares/rateLimit.js';

const router = Router();

router.get('/:orderId', downloadLimiter, getDownloads);

export default router;
