import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Protege rutas de admin. Exige un JWT valido (Bearer) firmado por el backend.
export function requireAdmin(req, res, next) {
  if (!env.admin.jwtSecret) {
    return res.status(500).json({ error: 'Admin no configurado en el servidor' });
  }

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const payload = jwt.verify(token, env.admin.jwtSecret);
    if (payload.role !== 'admin') throw new Error('rol invalido');
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}
