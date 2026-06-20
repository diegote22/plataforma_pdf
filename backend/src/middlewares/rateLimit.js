import rateLimit from 'express-rate-limit';

// SEC-001: limita creacion de ordenes. Evita spam de buyers/orders y
// quema de cuota de la API de Mercado Pago.
export const ordersLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 10, // 10 ordenes por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta en un momento' },
});

// Limite mas suelto para descargas (el token ya protege).
export const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta en un momento' },
});

// Login admin: estricto, frena fuerza bruta de la password.
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá unos minutos.' },
});
