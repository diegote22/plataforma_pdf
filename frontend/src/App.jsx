import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Catalog from './pages/Catalog.jsx';
import Checkout from './pages/Checkout.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import Download from './pages/Download.jsx';
import MisDescargas from './pages/MisDescargas.jsx';
import NotFound from './pages/NotFound.jsx';
import { Loading } from './components/States.jsx';

// Pesadas (pdf.js) -> carga diferida para no inflar el catalogo.
const MaterialDetail = lazy(() => import('./pages/MaterialDetail.jsx'));
const Reader = lazy(() => import('./pages/Reader.jsx'));

import AdminLayout from './components/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMaterialForm from './pages/admin/AdminMaterialForm.jsx';
import AdminMaterialEdit from './pages/admin/AdminMaterialEdit.jsx';
import { isAuthed } from './lib/admin.js';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        {/* ---- Admin ---- */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={<RequireAuth><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>}
        />
        <Route
          path="/admin/material/nuevo"
          element={<RequireAuth><AdminLayout><AdminMaterialForm /></AdminLayout></RequireAuth>}
        />
        <Route
          path="/admin/material/:id/editar"
          element={<RequireAuth><AdminLayout><AdminMaterialEdit /></AdminLayout></RequireAuth>}
        />

        {/* ---- Público ---- */}
        <Route path="/" element={<Layout><Catalog /></Layout>} />
        <Route path="/material/:id" element={<Layout><Suspense fallback={<Loading />}><MaterialDetail /></Suspense></Layout>} />
        <Route path="/checkout/:id" element={<Layout><Checkout /></Layout>} />
        <Route path="/pago/exito" element={<Layout><PaymentResult kind="success" /></Layout>} />
        <Route path="/pago/error" element={<Layout><PaymentResult kind="failure" /></Layout>} />
        <Route path="/pago/pendiente" element={<Layout><PaymentResult kind="pending" /></Layout>} />
        <Route path="/descarga" element={<Layout><Download /></Layout>} />
        <Route path="/leer" element={<Layout><Suspense fallback={<Loading />}><Reader /></Suspense></Layout>} />
        <Route path="/mis-descargas" element={<Layout><MisDescargas /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </>
  );
}
