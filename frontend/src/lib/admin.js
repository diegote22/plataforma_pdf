// Cliente del panel admin. Token JWT en localStorage.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const KEY = 'admin_token';

export const getToken = () => localStorage.getItem(KEY);
export const setToken = (t) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);
export const isAuthed = () => !!getToken();

async function adminFetch(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  // No fijamos Content-Type si es FormData (el browser pone el boundary).
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw Object.assign(new Error('Sesión expirada'), { status: 401 });
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'No se pudo iniciar sesión');
  }
  const { token } = await res.json();
  setToken(token);
  return token;
}

export const adminCategories = () => adminFetch('/api/admin/categories');
export const adminCreateCategory = (payload) =>
  adminFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) });

export const adminMaterials = () => adminFetch('/api/admin/materials');
export const adminCreateMaterial = (formData) =>
  adminFetch('/api/admin/materials', { method: 'POST', body: formData });
export const adminUpdateMaterial = (id, patch) =>
  adminFetch(`/api/admin/materials/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
export const adminDeleteMaterial = (id) =>
  adminFetch(`/api/admin/materials/${id}`, { method: 'DELETE' });
