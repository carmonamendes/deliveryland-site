import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastHost } from './components/Toast';
import { Catalog } from './pages/Catalog';
import { Booking } from './pages/Booking';
import { Retorno } from './pages/Retorno';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminReservas } from './pages/admin/AdminReservas';
import { AdminKits } from './pages/admin/AdminKits';
import { AdminConfig } from './pages/admin/AdminConfig';
import { RequireAuth } from './pages/admin/RequireAuth';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/kit/:id" element={<Booking />} />
        <Route path="/retorno/:tipo" element={<Retorno />} />

        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/reservas"
          element={<RequireAuth><AdminReservas /></RequireAuth>}
        />
        <Route
          path="/admin/kits"
          element={<RequireAuth><AdminKits /></RequireAuth>}
        />
        <Route
          path="/admin/config"
          element={<RequireAuth><AdminConfig /></RequireAuth>}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </>
  );
}
