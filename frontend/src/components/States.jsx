// Estados compartidos: carga, error, vacio.

export function Loading({ label = 'Cargando' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-ink" />
      <p className="label text-ink-faint">{label}…</p>
    </div>
  );
}

export function ErrorState({ message = 'Algo salió mal', onRetry }) {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <p className="font-display text-3xl">Ups.</p>
      <p className="mt-2 text-ink-soft">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ink mt-6 px-5 py-2.5">
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Empty({ message = 'Nada por aquí todavía' }) {
  return (
    <div className="py-24 text-center">
      <p className="font-display text-3xl opacity-30">∅</p>
      <p className="mt-2 text-ink-soft">{message}</p>
    </div>
  );
}
