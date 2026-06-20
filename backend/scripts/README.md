# Carga de materiales

Sube archivos a Supabase Storage e inserta filas en `materials`.

## Pasos

1. **Poné los archivos** (PDF/imagen/video + portadas) en `backend/scripts/assets/`.
2. **Copiá** `materials.example.json` → `materials.json` y editalo:
   - `category_slug`: `biologia` | `fisica` | `quimica` | `matematicas`
   - `title`, `description`, `features` (separá features con `;` o coma)
   - `price`: número en ARS (ej. `1500`)
   - `cover`: nombre del archivo de portada dentro de `assets/` (opcional)
   - `file`: nombre del archivo vendible dentro de `assets/`
3. **Corré:**
   ```bash
   cd backend
   npm run seed
   ```

## Notas
- `file` → bucket privado `materials` (solo signed URL post-pago).
- `cover` → bucket público `covers` (se ve en el catálogo).
- Re-ejecutable: el storage usa upsert. No corras dos veces con los mismos
  títulos o vas a duplicar filas en la tabla.
- `assets/` y `materials.json` están gitignoreados (no se suben al repo).
