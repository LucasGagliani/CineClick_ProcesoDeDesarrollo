import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { RequireAdmin, RequireAuth } from './components/layout/Guards';
import { PageLoader } from './components/ui/Spinner';
import Home from './pages/Home';
import Cartelera from './pages/Cartelera';
import PeliculaDetalle from './pages/PeliculaDetalle';
import Cines from './pages/Cines';
import Promociones from './pages/Promociones';
import Login from './pages/Login';
import Registro from './pages/Registro';
import NotFound from './pages/NotFound';

const Compra = lazy(() => import('./pages/compra/Compra'));
const MisCompras = lazy(() => import('./pages/MisCompras'));
const Perfil = lazy(() => import('./pages/Perfil'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminFunciones = lazy(() => import('./pages/admin/AdminFunciones'));
const AdminPeliculas = lazy(() => import('./pages/admin/AdminPeliculas'));
const AdminCines = lazy(() => import('./pages/admin/AdminCines'));
const AdminPromociones = lazy(() => import('./pages/admin/AdminPromociones'));
const AdminClientes = lazy(() => import('./pages/admin/AdminClientes'));
const AdminCompras = lazy(() => import('./pages/admin/AdminCompras'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="cartelera" element={<Cartelera />} />
          <Route path="peliculas/:id" element={<PeliculaDetalle />} />
          <Route path="cines" element={<Cines />} />
          <Route path="promociones" element={<Promociones />} />
          <Route path="login" element={<Login />} />
          <Route path="registro" element={<Registro />} />
          <Route element={<RequireAuth />}>
            <Route path="comprar/:funcionId" element={<Compra />} />
            <Route path="mis-compras" element={<MisCompras />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="funciones" element={<AdminFunciones />} />
          <Route path="peliculas" element={<AdminPeliculas />} />
          <Route path="cines" element={<AdminCines />} />
          <Route path="promociones" element={<AdminPromociones />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path="compras" element={<AdminCompras />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
