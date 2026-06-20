import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Catalog from './pages/Catalog.jsx';
import MaterialDetail from './pages/MaterialDetail.jsx';
import Checkout from './pages/Checkout.jsx';
import PaymentResult from './pages/PaymentResult.jsx';
import Download from './pages/Download.jsx';
import MisDescargas from './pages/MisDescargas.jsx';
import NotFound from './pages/NotFound.jsx';

import AdminLayout from './components/AdminLayout.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminMaterialForm from './pages/admin/AdminMaterialForm.jsx';
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

        {/* ---- Público ---- */}
        <Route path="/" element={<Layout><Catalog /></Layout>} />
        <Route path="/material/:id" element={<Layout><MaterialDetail /></Layout>} />
        <Route path="/checkout/:id" element={<Layout><Checkout /></Layout>} />
        <Route path="/pago/exito" element={<Layout><PaymentResult kind="success" /></Layout>} />
        <Route path="/pago/error" element={<Layout><PaymentResult kind="failure" /></Layout>} />
        <Route path="/pago/pendiente" element={<Layout><PaymentResult kind="pending" /></Layout>} />
        <Route path="/descarga" element={<Layout><Download /></Layout>} />
        <Route path="/mis-descargas" element={<Layout><MisDescargas /></Layout>} />
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </>
  );
}
