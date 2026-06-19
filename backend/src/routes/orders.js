import { Router } from 'express';
import { createOrder } from '../controllers/ordersController.js';
import { ordersLimiter } from '../middlewares/rateLimit.js';

const router = Router();

router.post('/', ordersLimiter, createOrder);

export default router;
