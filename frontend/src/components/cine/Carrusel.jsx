import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';

export default function Carrusel({ etiqueta, children, className = '' }) {
  const pista = useRef(null);
  const [limites, setLimites] = useState({ inicio: true, fin: true });

  const medir = useCallback(() => {
    const el = pista.current;
    if (!el) return;
    setLimites({ inicio: el.scrollLeft <= 4, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    medir();
    const el = pista.current;
    if (!el) return undefined;
    el.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    return () => {
      el.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
    };
  }, [medir, children]);

  const desplazar = (direccion) => {
    const el = pista.current;
    el.scrollBy({ left: direccion * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <div className={`carrusel ${className}`.trim()}>
      <button
        type="button"
        className="carrusel__flecha carrusel__flecha--izq boton-circular"
        onClick={() => desplazar(-1)}
        disabled={limites.inicio}
        aria-label={`Desplazar ${etiqueta} a la izquierda`}
      >
        <CaretLeft size={20} />
      </button>
      <div className="carrusel__pista" ref={pista} role="list" aria-label={etiqueta}>
        {children}
      </div>
      <button
        type="button"
        className="carrusel__flecha carrusel__flecha--der boton-circular"
        onClick={() => desplazar(1)}
        disabled={limites.fin}
        aria-label={`Desplazar ${etiqueta} a la derecha`}
      >
        <CaretRight size={20} />
      </button>
    </div>
  );
}
