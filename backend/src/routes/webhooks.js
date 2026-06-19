import { Router } from 'express';
import { mercadopagoWebhook } from '../controllers/webhooksController.js';

const router = Router();

router.post('/mercadopago', mercadopagoWebhook);

export default router;
