import { supabase } from '../config/supabase.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

// GET /api/categories  -> lista de categorias ordenadas por nombre
export const listCategories = asyncHandler(async (_req, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .order('name');

  if (error) throw error;
  res.json(data);
});
