import { MagnifyingGlass } from '@phosphor-icons/react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function AdminCabecera({ titulo, descripcion, children }) {
  useDocumentTitle(`Admin · ${titulo}`);
  return (
    <header className="admin-cabecera">
      <div>
        <h1 className="admin-cabecera__titulo">{titulo}</h1>
        {descripcion && <p className="texto-secundario">{descripcion}</p>}
      </div>
      {children && <div className="admin-cabecera__acciones">{children}</div>}
    </header>
  );
}

export function Buscador({ valor, onCambiar, placeholder = 'Buscar…', etiqueta = 'Buscar' }) {
  return (
    <label className="buscador buscador--compacto">
      <MagnifyingGlass size={18} aria-hidden="true" />
      <span className="sr-only">{etiqueta}</span>
      <input type="search" value={valor} placeholder={placeholder} onChange={(e) => onCambiar(e.target.value)} />
    </label>
  );
}

export function ErroresServidor({ error }) {
  if (!error) return null;
  return (
    <div className="alerta alerta--error" role="alert">
      <div>
        <strong>{error.message}</strong>
        {error.detalles?.length > 0 && (
          <ul>
            {error.detalles.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const normalizar = (texto = '') => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
