import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowSquareOut, Buildings, CalendarBlank, FilmStrip, Gauge, List, Percent, Receipt, SignOut, Users, X } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/layout/Logo';
import { PageLoader } from '../../components/ui/Spinner';
import { useScrollAlCambiarRuta } from '../../components/layout/Layout';

const SECCIONES = [
  { to: '/admin', texto: 'Resumen', icono: Gauge, exacto: true },
  { to: '/admin/funciones', texto: 'Funciones', icono: CalendarBlank },
  { to: '/admin/peliculas', texto: 'Películas', icono: FilmStrip },
  { to: '/admin/cines', texto: 'Cines y salas', icono: Buildings },
  { to: '/admin/promociones', texto: 'Promociones', icono: Percent },
  { to: '/admin/clientes', texto: 'Clientes', icono: Users },
  { to: '/admin/compras', texto: 'Compras', icono: Receipt },
];

export default function AdminLayout() {
  const { sesion, logout } = useAuth();
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const principal = useScrollAlCambiarRuta();

  useEffect(() => setMenuAbierto(false), [pathname]);

  return (
    <div className="admin">
      <a href="#admin-contenido" className="skip-link">
        Saltar al contenido
      </a>
      <aside className={`admin__sidebar ${menuAbierto ? 'admin__sidebar--abierta' : ''}`} aria-label="Navegación de administración">
        <div className="admin__marca">
          <Logo destino="/admin" />
          <span className="admin__etiqueta">Admin</span>
        </div>
        <nav className="admin__nav">
          {SECCIONES.map(({ to, texto, icono: Icono, exacto }) => (
            <NavLink key={to} to={to} end={exacto} className="admin__link">
              <Icono size={20} aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="admin__pie">
          <NavLink to="/" className="admin__link">
            <ArrowSquareOut size={20} aria-hidden="true" /> Ver sitio público
          </NavLink>
          <button
            type="button"
            className="admin__link admin__link--peligro"
            onClick={() => {
              logout();
              navegar('/');
            }}
          >
            <SignOut size={20} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </aside>
      {menuAbierto && <div className="admin__scrim" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}

      <div className="admin__area">
        <header className="admin__topbar">
          <button type="button" className="navbar__hamburguesa admin__menu" aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuAbierto} onClick={() => setMenuAbierto((v) => !v)}>
            {menuAbierto ? <X size={24} /> : <List size={24} />}
          </button>
          <span className="admin__usuario">
            <span className="avatar" aria-hidden="true">
              {sesion.nombre[0]}
            </span>
            {sesion.nombre}
          </span>
        </header>
        <main id="admin-contenido" className="admin__contenido" tabIndex={-1} ref={principal}>
          <Suspense fallback={<PageLoader />}>
            <div key={pathname} className="transicion-ruta">
              <Outlet />
            </div>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
