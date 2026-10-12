import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { PageLoader } from '../ui/Spinner';

export function useScrollAlCambiarRuta() {
  const { pathname } = useLocation();
  const primeraCarga = useRef(true);
  const principal = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (primeraCarga.current) {
      primeraCarga.current = false;
      return;
    }
    principal.current?.focus({ preventScroll: true });
  }, [pathname]);

  return principal;
}

export default function Layout() {
  const { pathname } = useLocation();
  const principal = useScrollAlCambiarRuta();

  return (
    <>
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido" tabIndex={-1} ref={principal} className="principal">
        <Suspense fallback={<PageLoader />}>
          <div key={pathname} className="transicion-ruta">
            <Outlet />
          </div>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
