import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { PDFDocument } from 'pdf-lib';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const COVERS_BUCKET = 'covers';
const PREVIEWS_BUCKET = 'previews';
const FILES_BUCKET = env.supabase.storageBucket; // 'materials'

// Extrae las primeras N paginas de un PDF -> Buffer (para el preview publico).
async function makePreview(buffer, n = 3) {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const count = Math.min(n, src.getPageCount());
  const pages = await out.copyPages(src, Array.from({ length: count }, (_, i) => i));
  pages.forEach((p) => out.addPage(p));
  return Buffer.from(await out.save());
}

// NFD + quitar todo lo no-ASCII (acentos quedan como letra base) -> slug.
const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const extOf = (name) => (name.split('.').pop() || '').toLowerCase();

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

// POST /api/admin/login
export const login = asyncHandler(async (req, res) => {
  if (!env.admin.password || !env.admin.jwtSecret) {
    return res.status(500).json({ error: 'Admin no configurado en el servidor' });
  }
  const password = req.body?.password || '';
  if (!safeEqual(password, env.admin.password)) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  const token = jwt.sign({ role: 'admin' }, env.admin.jwtSecret, {
    expiresIn: env.admin.tokenTtl,
  });
  res.json({ token });
});

// GET /api/admin/categories  (todas)
export const listCategories = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .order('name');
  if (error) throw error;
  res.json(data);
});

// POST /api/admin/categories  { name, icon? }
export const createCategory = asyncHandler(async (req, res) => {
  const name = (req.body?.name || '').trim();
  const icon = (req.body?.icon || '').trim() || null;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });

  const slug = slugify(name);
  if (!slug) return res.status(400).json({ error: 'Nombre inválido' });

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, icon })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Esa categoría ya existe' });
    throw error;
  }
  res.status(201).json(data);
});

// GET /api/admin/materials  (todas, incluidas inactivas)
export const listMaterials = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, price, is_active, file_type, cover_image_url, created_at, categories(name, slug)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data);
});

// POST /api/admin/materials  (multipart: file, cover + campos)
export const createMaterial = asyncHandler(async (req, res) => {
  const { category_id, title, description, features, price, price_view } = req.body;
  const file = req.files?.file?.[0];
  const cover = req.files?.cover?.[0];

  // ---- Validacion ----
  const errors = [];
  if (!category_id) errors.push('categoría requerida');
  if (!title?.trim()) errors.push('título requerido');
  if (!(Number(price) >= 0)) errors.push('precio de descarga inválido');
  if (price_view !== undefined && price_view !== '' && !(Number(price_view) >= 0))
    errors.push('precio de ver online inválido');
  if (!file) errors.push('archivo requerido');
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });

  // ---- Resolver slug de la categoria para nombrar los objetos ----
  const { data: cat, error: catErr } = await supabase
    .from('categories').select('slug').eq('id', category_id).maybeSingle();
  if (catErr) throw catErr;
  if (!cat) return res.status(400).json({ error: 'Categoría inexistente' });

  const base = `${cat.slug}/${slugify(title)}-${Date.now()}`;

  // ---- Subir archivo (bucket privado) ----
  const fileKey = `${base}.${extOf(file.originalname)}`;
  const up1 = await supabase.storage.from(FILES_BUCKET).upload(fileKey, file.buffer, {
    contentType: file.mimetype, upsert: false,
  });
  if (up1.error) throw new Error(`subiendo archivo: ${up1.error.message}`);

  // ---- Subir portada (bucket publico) ----
  let cover_image_url = null;
  if (cover) {
    const coverKey = `${base}.${extOf(cover.originalname)}`;
    const up2 = await supabase.storage.from(COVERS_BUCKET).upload(coverKey, cover.buffer, {
      contentType: cover.mimetype, upsert: false,
    });
    if (up2.error) throw new Error(`subiendo portada: ${up2.error.message}`);
    cover_image_url = supabase.storage.from(COVERS_BUCKET).getPublicUrl(coverKey).data.publicUrl;
  }

  // ---- Preview de 3 paginas (solo PDFs) -> bucket publico ----
  let preview_url = null;
  if (extOf(file.originalname) === 'pdf') {
    try {
      const previewBuf = await makePreview(file.buffer, 3);
      const previewKey = `${base}-preview.pdf`;
      const up3 = await supabase.storage.from(PREVIEWS_BUCKET).upload(previewKey, previewBuf, {
        contentType: 'application/pdf', upsert: false,
      });
      if (!up3.error) {
        preview_url = supabase.storage.from(PREVIEWS_BUCKET).getPublicUrl(previewKey).data.publicUrl;
      }
    } catch {
      // Si el PDF no se puede procesar, seguimos sin preview.
    }
  }

  // ---- Insertar fila ----
  const { data, error } = await supabase.from('materials').insert({
    category_id,
    title: title.trim(),
    description: description?.trim() || null,
    features: features?.trim() || null,
    price: Number(price),
    price_view: price_view !== undefined && price_view !== '' ? Number(price_view) : null,
    cover_image_url,
    preview_url,
    file_url: fileKey,
    file_type: extOf(file.originalname),
    is_active: true,
  }).select().single();

  if (error) throw error;
  res.status(201).json(data);
});

// PATCH /api/admin/materials/:id  { price?, is_active?, title?, description?, features? }
export const updateMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const patch = {};
  for (const k of ['title', 'description', 'features', 'price', 'price_view', 'is_active']) {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  }
  if (patch.price !== undefined) patch.price = Number(patch.price);
  if (patch.price_view !== undefined) {
    patch.price_view = patch.price_view === null || patch.price_view === '' ? null : Number(patch.price_view);
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }

  const { data, error } = await supabase
    .from('materials').update(patch).eq('id', id).select().maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Material no encontrado' });
  res.json(data);
});

// DELETE /api/admin/materials/:id
export const deleteMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: mat, error: getErr } = await supabase
    .from('materials').select('file_url, cover_image_url').eq('id', id).maybeSingle();
  if (getErr) throw getErr;
  if (!mat) return res.status(404).json({ error: 'Material no encontrado' });

  const { error: delErr } = await supabase.from('materials').delete().eq('id', id);
  if (delErr) {
    // 23503 = FK: el material esta en una orden -> mejor desactivar.
    if (delErr.code === '23503') {
      return res.status(409).json({
        error: 'No se puede borrar: ya fue comprado. Desactivalo en su lugar.',
      });
    }
    throw delErr;
  }

  // Limpiar storage (best-effort)
  if (mat.file_url) {
    await supabase.storage.from(FILES_BUCKET).remove([mat.file_url]).catch(() => {});
  }
  res.json({ ok: true });
});
