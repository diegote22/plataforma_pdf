import { Router } from 'express';
import { listMaterials, getMaterial } from '../controllers/materialsController.js';

const router = Router();

router.get('/', listMaterials);
router.get('/:id', getMaterial);

export default router;
