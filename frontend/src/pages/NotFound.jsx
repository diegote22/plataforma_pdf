import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-5 py-28 text-center">
      <p className="font-display text-8xl font-black opacity-20">404</p>
      <h1 className="font-display mt-4 text-3xl font-bold">Esta página no existe</h1>
      <p className="mt-2 text-ink-soft">Quizá el material se movió o el enlace está roto.</p>
      <Link to="/" className="btn-ink mt-7 px-6 py-3">Volver al catálogo</Link>
    </div>
  );
}
