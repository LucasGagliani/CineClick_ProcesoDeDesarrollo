import { ArrowClockwise, FilmSlate, WarningCircle } from '@phosphor-icons/react';
import Button from './Button';

export function EmptyState({ icono: Icono = FilmSlate, titulo, descripcion, children }) {
  return (
    <div className="state">
      <span className="state__icono" aria-hidden="true">
        <Icono size={32} />
      </span>
      <h3 className="state__titulo">{titulo}</h3>
      {descripcion && <p className="state__descripcion">{descripcion}</p>}
      {children && <div className="state__acciones">{children}</div>}
    </div>
  );
}

export function ErrorState({ error, onReintentar, titulo = 'No pudimos cargar la información' }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icono" aria-hidden="true">
        <WarningCircle size={32} />
      </span>
      <h3 className="state__titulo">{titulo}</h3>
      <p className="state__descripcion">{error?.message}</p>
      {onReintentar && (
        <div className="state__acciones">
          <Button variante="secondary" onClick={onReintentar}>
            <ArrowClockwise size={18} aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className = '', style }) {
  return <span className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}
