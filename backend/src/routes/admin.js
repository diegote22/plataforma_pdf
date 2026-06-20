import { Router } from 'express';
import multer from 'multer';
import {
  login,
  listCategories,
  createCategory,
  listMaterials,
  getMaterial,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from '../controllers/adminController.js';
import { requireAdmin } from '../middlewares/requireAdmin.js';
import { loginLimiter } from '../middlewares/rateLimit.js';

// Archivos en memoria (luego se suben a Supabase). Limite 100 MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

const router = Router();

// Publico (con rate limit)
router.post('/login', loginLimiter, login);

// Protegido
router.get('/categories', requireAdmin, listCategories);
router.post('/categories', requireAdmin, createCategory);

router.get('/materials', requireAdmin, listMaterials);
router.get('/materials/:id', requireAdmin, getMaterial);
router.post(
  '/materials',
  requireAdmin,
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  createMaterial
);
router.patch('/materials/:id', requireAdmin, updateMaterial);
router.delete('/materials/:id', requireAdmin, deleteMaterial);

export default router;
