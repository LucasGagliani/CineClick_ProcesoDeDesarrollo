import { useState } from 'react';
import { Check, Copy, Tag } from '@phosphor-icons/react';
import { formatearFecha } from '../../utils/format';

export default function PromoCard({ promo }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(promo.codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  };

  return (
    <article className="promo-card">
      <div className="promo-card__porcentaje">
        <strong>{Number(promo.porcentajeDescuento)}%</strong>
        <span>OFF</span>
      </div>
      <div className="promo-card__info">
        <p className="promo-card__descripcion">{promo.descripcion}</p>
        <p className="texto-secundario promo-card__vigencia">
          Válida del {formatearFecha(promo.fechaInicio)} al {formatearFecha(promo.fechaFin)}
        </p>
        <button type="button" className="promo-card__codigo" onClick={copiar} aria-label={`Copiar código ${promo.codigo}`}>
          <Tag size={16} aria-hidden="true" />
          <code>{promo.codigo}</code>
          {copiado ? <Check size={16} weight="bold" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          <span className="sr-only" aria-live="polite">
            {copiado ? 'Código copiado' : ''}
          </span>
        </button>
      </div>
    </article>
  );
}
