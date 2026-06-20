import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Document, Page } from 'react-pdf';
import HTMLFlipBook from 'react-pageflip';
import '../lib/pdf.js';
import { getDownloads } from '../lib/api.js';
import { Loading } from '../components/States.jsx';

export default function Reader() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const token = params.get('token');
  const idx = Number(params.get('i') || 0);

  const [state, setState] = useState('loading'); // loading | pending | ready | error
  const [item, setItem] = useState(null);
  const [message, setMessage] = useState('');

  // dimensiones del libro (responsive)
  const [dims, setDims] = useState({ w: 380, h: 537 });
  useEffect(() => {
    const calc = () => {
      const w = Math.min(440, Math.floor((window.innerWidth - 60) / (window.innerWidth >= 1024 ? 2 : 1)));
      setDims({ w, h: Math.round(w * 1.414) });
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const fetchItem = useCallback(async () => {
    if (!orderId || !token) { setState('error'); setMessage('Link incompleto.'); return; }
    try {
      const data = await getDownloads(orderId, token);
      const views = (data.downloads || []);
      const chosen = views[idx] || views.find((d) => d.access_type === 'view') || views[0];
      if (!chosen) { setState('error'); setMessage('No hay material para leer.'); return; }
      setItem(chosen);
      setState('ready');
    } catch (e) {
      if (e.status === 403 && /confirmado/i.test(e.message)) setState('pending');
      else { setState('error'); setMessage(e.message); }
    }
  }, [orderId, token, idx]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  if (state === 'loading') return <Loading label="Abriendo lector" />;
  if (state === 'pending') return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="font-display text-3xl font-bold">Confirmando el pago…</h1>
      <p className="mt-2 text-ink-soft">Esperá unos segundos y recargá.</p>
      <button onClick={fetchItem} className="btn-ink mt-5 px-6 py-3">Reintentar</button>
    </div>
  );
  if (state === 'error') return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <p className="font-display text-3xl">No se pudo abrir.</p>
      <p className="mt-2 text-ink-soft">{message}</p>
      <Link to="/mis-descargas" className="btn-ink mt-5 inline-block px-6 py-3">Mis descargas</Link>
    </div>
  );

  return <Book url={item.url} title={item.title} dims={dims} />;
}

function Book({ url, title, dims }) {
  const book = useRef(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(0);
  const [toc, setToc] = useState([]);
  const [tocOpen, setTocOpen] = useState(false);

  async function onDoc(pdf) {
    setNumPages(pdf.numPages);
    try {
      const outline = await pdf.getOutline();
      if (outline?.length) {
        const flat = [];
        const walk = async (items, depth) => {
          for (const it of items) {
            let pageIndex = null;
            try {
              const dest = typeof it.dest === 'string' ? await pdf.getDestination(it.dest) : it.dest;
              if (dest?.[0]) pageIndex = await pdf.getPageIndex(dest[0]);
            } catch { /* dest no resoluble */ }
            flat.push({ title: it.title, page: pageIndex, depth });
            if (it.items?.length) await walk(it.items, depth + 1);
          }
        };
        await walk(outline, 0);
        setToc(flat.filter((t) => t.page != null));
      }
    } catch { /* sin outline */ }
  }

  const goTo = (p) => { book.current?.pageFlip()?.flip(p); setTocOpen(false); };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8" onContextMenu={(e) => e.preventDefault()}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/mis-descargas" className="label text-ink-faint hover:text-ink">← Salir</Link>
        <p className="truncate font-display text-lg font-semibold">{title}</p>
        <button onClick={() => setTocOpen((v) => !v)} className="label rounded-full border border-line px-3 py-1.5 hover:border-ink">
          ☰ Índice
        </button>
      </div>

      <div className="relative flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDoc}
          loading={<Loading label="Cargando libro" />}
          error={<p className="label py-16 text-mat">No se pudo cargar el material.</p>}
          className="select-none"
        >
          {numPages > 0 && (
            <HTMLFlipBook
              ref={book}
              width={dims.w}
              height={dims.h}
              size="fixed"
              showCover={false}
              maxShadowOpacity={0.3}
              mobileScrollSupport
              onFlip={(e) => setPage(e.data)}
              className="shadow-xl"
            >
              {Array.from({ length: numPages }, (_, i) => (
                <div key={i} className="overflow-hidden bg-white" style={{ width: dims.w, height: dims.h }}>
                  <Page pageNumber={i + 1} width={dims.w} renderTextLayer={false} renderAnnotationLayer={false} />
                </div>
              ))}
            </HTMLFlipBook>
          )}
        </Document>

        {/* Índice */}
        {tocOpen && (
          <div className="absolute right-0 top-0 z-20 max-h-[70vh] w-72 overflow-y-auto border border-line bg-paper-2 p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="label">Índice</span>
              <button onClick={() => setTocOpen(false)} className="text-ink-faint">✕</button>
            </div>
            {toc.length === 0 ? (
              <p className="text-sm text-ink-soft">Este material no tiene índice.</p>
            ) : (
              <ul className="space-y-1">
                {toc.map((t, i) => (
                  <li key={i}>
                    <button
                      onClick={() => goTo(t.page)}
                      className="block w-full truncate text-left text-sm text-ink-soft hover:text-ink"
                      style={{ paddingLeft: `${t.depth * 12}px` }}
                    >
                      {t.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button onClick={() => book.current?.pageFlip()?.flipPrev()} className="btn-ink px-5 py-2.5">← Anterior</button>
        <span className="label text-ink-faint">{Math.min(page + 1, numPages)} / {numPages}</span>
        <button onClick={() => book.current?.pageFlip()?.flipNext()} className="btn-ink px-5 py-2.5">Siguiente →</button>
      </div>

      <p className="label mt-4 text-center text-ink-faint">
        Lectura online · Pasá las hojas o usá el índice
      </p>
    </div>
  );
}
