// =====================================================================
// Carga de materiales por script (alternativa al panel admin).
// Sube archivo (bucket privado) + portada (bucket publico) e inserta la
// fila en `materials`.
//
// Uso:
//   1. Pone tus archivos en backend/scripts/assets/
//   2. Edita backend/scripts/materials.json (ver materials.example.json)
//   3. cd backend && npm run seed
// =====================================================================
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabase } from '../src/config/supabase.js';
import { env } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(__dirname, 'assets');
const MANIFEST = path.join(__dirname, 'materials.json');

const COVERS_BUCKET = 'covers';
const FILES_BUCKET = env.supabase.storageBucket; // 'materials'

const CONTENT_TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  mp4: 'video/mp4',
  zip: 'application/zip',
};

const slugify = (s) =>
  String(s).toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const ext = (f) => f.split('.').pop().toLowerCase();
const ctype = (f) => CONTENT_TYPES[ext(f)] || 'application/octet-stream';

async function uploadTo(bucket, key, localFile) {
  const buf = await readFile(path.join(ASSETS, localFile));
  const { error } = await supabase.storage.from(bucket).upload(key, buf, {
    contentType: ctype(localFile),
    upsert: true,
  });
  if (error) throw new Error(`upload ${bucket}/${key}: ${error.message}`);
  return key;
}

async function main() {
  let items;
  try {
    items = JSON.parse(await readFile(MANIFEST, 'utf8'));
  } catch {
    console.error('No se pudo leer materials.json. Copia materials.example.json -> materials.json');
    process.exit(1);
  }

  const { data: cats, error: catErr } = await supabase.from('categories').select('id, slug');
  if (catErr) throw catErr;
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  let ok = 0;
  for (const it of items) {
    try {
      const category_id = catId[it.category_slug];
      if (!category_id) throw new Error(`categoria desconocida: ${it.category_slug}`);

      const base = `${it.category_slug}/${slugify(it.title)}`;

      const fileKey = await uploadTo(FILES_BUCKET, `${base}.${ext(it.file)}`, it.file);

      let cover_image_url = null;
      if (it.cover) {
        const coverKey = await uploadTo(COVERS_BUCKET, `${base}.${ext(it.cover)}`, it.cover);
        cover_image_url = supabase.storage.from(COVERS_BUCKET).getPublicUrl(coverKey).data.publicUrl;
      }

      const { error } = await supabase.from('materials').insert({
        category_id,
        title: it.title,
        description: it.description || null,
        features: it.features || null,
        price: it.price,
        cover_image_url,
        file_url: fileKey,
        file_type: ext(it.file),
        is_active: it.is_active ?? true,
      });
      if (error) throw error;

      console.log(`OK  ${it.title}`);
      ok++;
    } catch (e) {
      console.error(`ERR ${it.title}: ${e.message}`);
    }
  }
  console.log(`\nListo. ${ok}/${items.length} cargados.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
