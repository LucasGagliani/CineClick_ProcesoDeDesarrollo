import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="contenedor footer__grid">
        <div className="footer__marca">
          <Logo />
          <p>Tu próxima función está a un click. Elegí la película, la sala y tu butaca favorita.</p>
        </div>
        <nav aria-label="Explorar">
          <h2 className="footer__titulo">Explorar</h2>
          <ul>
            <li><Link to="/cartelera">Cartelera</Link></li>
            <li><Link to="/cines">Cines</Link></li>
            <li><Link to="/promociones">Promociones</Link></li>
          </ul>
        </nav>
        <nav aria-label="Mi cuenta">
          <h2 className="footer__titulo">Mi cuenta</h2>
          <ul>
            <li><Link to="/mis-compras">Mis compras</Link></li>
            <li><Link to="/perfil">Mi perfil</Link></li>
            <li><Link to="/registro">Crear cuenta</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="footer__titulo">Ayuda</h2>
          <ul>
            <li>Presentá el código QR de tu entrada en el acceso a la sala.</li>
            <li>Las butacas VIP tienen un recargo del 30%.</li>
          </ul>
        </div>
      </div>
      <div className="contenedor footer__legal">
        <span>© {new Date().getFullYear()} CineClick · TPO Aplicaciones Interactivas</span>
      </div>
    </footer>
  );
}
