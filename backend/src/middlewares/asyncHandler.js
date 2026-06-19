// Envuelve un handler async y manda cualquier error al error handler global.
// Evita try/catch repetido en cada controller.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
