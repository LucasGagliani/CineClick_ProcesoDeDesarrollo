import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  CaretDown,
  FilmStrip,
  Gauge,
  List,
  MapPin,
  Percent,
  Receipt,
  SignOut,
  Ticket,
  UserCircle,
  X,
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import Logo from './Logo';
import { ButtonLink } from '../ui/Button';

const LINKS = [
  { to: '/cartelera', texto: 'Cartelera', icono: FilmStrip },
  { to: '/cines', texto: 'Cines', icono: MapPin },
  { to: '/promociones', texto: 'Promociones', icono: Percent },
];

function iniciales(nombre = '') {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function MenuUsuario() {
  const { sesion, esAdmin, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    if (!abierto) return undefined;
    const alClick = (e) => !contenedor.current?.contains(e.target) && setAbierto(false);
    const alTeclear = (e) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', alClick);
    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('mousedown', alClick);
      document.removeEventListener('keydown', alTeclear);
    };
  }, [abierto]);

  const salir = () => {
    logout();
    setAbierto(false);
    navegar('/');
  };

  return (
    <div className="menu-usuario" ref={contenedor}>
      <button
        type="button"
        className="menu-usuario__boton"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        <span className="avatar" aria-hidden="true">
          {iniciales(sesion.nombre)}
        </span>
        <span className="menu-usuario__nombre">{sesion.nombre.split(' ')[0]}</span>
        <CaretDown size={14} aria-hidden="true" />
      </button>
      {abierto && (
        <div className="menu-usuario__panel" role="menu">
          <div className="menu-usuario__cabecera">
            <strong>{sesion.nombre}</strong>
            <span>{sesion.email}</span>
          </div>
          {esAdmin ? (
            <Link role="menuitem" to="/admin" className="menu-usuario__item" onClick={() => setAbierto(false)}>
              <Gauge size={18} aria-hidden="true" /> Panel de administración
            </Link>
          ) : (
            <>
              <Link role="menuitem" to="/mis-compras" className="menu-usuario__item" onClick={() => setAbierto(false)}>
                <Receipt size={18} aria-hidden="true" /> Mis compras
              </Link>
              <Link role="menuitem" to="/perfil" className="menu-usuario__item" onClick={() => setAbierto(false)}>
                <UserCircle size={18} aria-hidden="true" /> Mi perfil
              </Link>
            </>
          )}
          <hr />
          <button type="button" role="menuitem" className="menu-usuario__item menu-usuario__item--peligro" onClick={salir}>
            <SignOut size={18} aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { estaLogueado, esAdmin, sesion, logout } = useAuth();
  const [conFondo, setConFondo] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();
  const navegar = useNavigate();

  useEffect(() => {
    const alScroll = () => setConFondo(window.scrollY > 24);
    alScroll();
    window.addEventListener('scroll', alScroll, { passive: true });
    return () => window.removeEventListener('scroll', alScroll);
  }, []);

  useEffect(() => setDrawer(false), [pathname]);

  useEffect(() => {
    document.body.classList.toggle('sin-scroll', drawer);
    if (!drawer) return undefined;
    const alTeclear = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [drawer]);

  return (
    <header className={`navbar ${conFondo || pathname !== '/' ? 'navbar--solida' : ''}`}>
      <div className="contenedor navbar__fila">
        <Logo />

        <nav className="navbar__links" aria-label="Principal">
          {LINKS.map(({ to, texto }) => (
            <NavLink key={to} to={to} className="navbar__link">
              {texto}
            </NavLink>
          ))}
        </nav>

        <div className="navbar__acciones">
          {estaLogueado ? (
            <MenuUsuario />
          ) : (
            <>
              <ButtonLink to="/login" variante="ghost" tamano="sm" className="solo-escritorio">
                Ingresar
              </ButtonLink>
              <ButtonLink to="/registro" tamano="sm" className="solo-escritorio">
                <Ticket size={18} aria-hidden="true" />
                Registrarme
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            className="navbar__hamburguesa"
            aria-label="Abrir menú"
            aria-expanded={drawer}
            aria-controls="drawer-navegacion"
            onClick={() => setDrawer(true)}
          >
            <List size={26} />
          </button>
        </div>
      </div>

      <div className={`drawer ${drawer ? 'drawer--abierto' : ''}`} aria-hidden={!drawer}>
        <div className="drawer__scrim" onClick={() => setDrawer(false)} />
        <aside className="drawer__panel" id="drawer-navegacion" aria-label="Menú móvil">
          <div className="drawer__cabecera">
            <Logo />
            <button type="button" className="navbar__hamburguesa" aria-label="Cerrar menú" onClick={() => setDrawer(false)} tabIndex={drawer ? 0 : -1}>
              <X size={26} />
            </button>
          </div>
          {estaLogueado && (
            <div className="drawer__usuario">
              <span className="avatar" aria-hidden="true">
                {iniciales(sesion.nombre)}
              </span>
              <div>
                <strong>{sesion.nombre}</strong>
                <span>{sesion.email}</span>
              </div>
            </div>
          )}
          <nav className="drawer__links" aria-label="Principal móvil">
            {LINKS.map(({ to, texto, icono: Icono }) => (
              <NavLink key={to} to={to} className="drawer__link" tabIndex={drawer ? 0 : -1}>
                <Icono size={22} aria-hidden="true" /> {texto}
              </NavLink>
            ))}
            {estaLogueado && !esAdmin && (
              <>
                <NavLink to="/mis-compras" className="drawer__link" tabIndex={drawer ? 0 : -1}>
                  <Receipt size={22} aria-hidden="true" /> Mis compras
                </NavLink>
                <NavLink to="/perfil" className="drawer__link" tabIndex={drawer ? 0 : -1}>
                  <UserCircle size={22} aria-hidden="true" /> Mi perfil
                </NavLink>
              </>
            )}
            {esAdmin && (
              <NavLink to="/admin" className="drawer__link" tabIndex={drawer ? 0 : -1}>
                <Gauge size={22} aria-hidden="true" /> Panel de administración
              </NavLink>
            )}
          </nav>
          <div className="drawer__pie">
            {estaLogueado ? (
              <button
                type="button"
                className="btn btn--secondary btn--md btn--block"
                tabIndex={drawer ? 0 : -1}
                onClick={() => {
                  logout();
                  navegar('/');
                }}
              >
                <SignOut size={18} aria-hidden="true" /> Cerrar sesión
              </button>
            ) : (
              <>
                <ButtonLink to="/registro" bloque tabIndex={drawer ? 0 : -1}>
                  Crear cuenta
                </ButtonLink>
                <ButtonLink to="/login" variante="secondary" bloque tabIndex={drawer ? 0 : -1}>
                  Ingresar
                </ButtonLink>
              </>
            )}
          </div>
        </aside>
      </div>
    </header>
  );
}
