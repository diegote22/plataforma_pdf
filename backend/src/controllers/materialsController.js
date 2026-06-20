import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

// Columnas SEGURAS del catalogo. NUNCA incluir file_url aca: ese link solo
// se entrega como signed URL temporal tras confirmar el pago.
const SAFE_COLUMNS =
  'id, category_id, title, description, features, price, price_view, cover_image_url, preview_url, file_type, created_at';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/materials?category=<slug>
// Lista materiales activos. Filtro opcional por slug de categoria.
export const listMaterials = asyncHandler(async (req, res) => {
  const { category } = req.query;

  // !inner fuerza el join cuando filtramos por slug; si no, embed normal.
  const embed = category
    ? 'categories!inner(name, slug)'
    : 'categories(name, slug)';

  let query = supabase
    .from('materials')
    .select(`${SAFE_COLUMNS}, ${embed}`)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (category) query = query.eq('categories.slug', category);

  const { data, error } = await query;
  if (error) throw error;
  res.json(data);
});

// GET /api/materials/:id  -> detalle de un material activo
export const getMaterial = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validar UUID antes de pegarle a la DB (evita error 22P02 -> 500).
  if (!UUID_RE.test(id)) {
    return res.status(400).json({ error: 'id invalido' });
  }

  const { data, error } = await supabase
    .from('materials')
    .select(`${SAFE_COLUMNS}, categories(name, slug)`)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Material no encontrado' });
  res.json(data);
});
