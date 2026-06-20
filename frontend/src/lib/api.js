// Wrapper minimo sobre fetch hacia el backend Express.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const getCategories = () => api('/api/categories');

export const getMaterials = (categorySlug) =>
  api(`/api/materials${categorySlug ? `?category=${encodeURIComponent(categorySlug)}` : ''}`);

export const getMaterial = (id) => api(`/api/materials/${id}`);

export const createOrder = (payload) =>
  api('/api/orders', { method: 'POST', body: JSON.stringify(payload) });

export const getDownloads = (orderId, token) =>
  api(`/api/download/${orderId}?token=${encodeURIComponent(token)}`);
