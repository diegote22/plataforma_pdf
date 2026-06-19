// Wrapper minimo sobre fetch hacia el backend Express.
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function api(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }

  return res.json();
}
