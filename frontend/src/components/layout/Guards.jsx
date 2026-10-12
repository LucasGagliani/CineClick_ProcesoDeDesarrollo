import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function RequireAuth() {
  const { estaLogueado } = useAuth();
  const location = useLocation();
  if (!estaLogueado) {
    const destino = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${destino}`} replace />;
  }
  return <Outlet />;
}

export function RequireAdmin({ children }) {
  const { estaLogueado, esAdmin } = useAuth();
  const location = useLocation();
  if (!estaLogueado) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (!esAdmin) return <Navigate to="/" replace />;
  return children;
}
