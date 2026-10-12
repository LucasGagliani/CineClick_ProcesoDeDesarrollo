import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';
import Button from './Button';

const SELECTOR_FOCO = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ abierto, onCerrar, titulo, descripcion, children, pie, ancho = 'md' }) {
  const idTitulo = useId();
  const panelRef = useRef(null);
  const onCerrarRef = useRef(onCerrar);
  onCerrarRef.current = onCerrar;

  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.activeElement;
    document.body.classList.add('sin-scroll');
    const primero = panelRef.current?.querySelector('input, select, textarea') ?? panelRef.current?.querySelector(SELECTOR_FOCO);
    primero?.focus();

    const alTeclear = (evento) => {
      if (evento.key === 'Escape') onCerrarRef.current?.();
      if (evento.key !== 'Tab' || !panelRef.current) return;
      const focos = [...panelRef.current.querySelectorAll(SELECTOR_FOCO)];
      if (focos.length === 0) return;
      const inicio = focos[0];
      const fin = focos[focos.length - 1];
      if (evento.shiftKey && document.activeElement === inicio) {
        evento.preventDefault();
        fin.focus();
      } else if (!evento.shiftKey && document.activeElement === fin) {
        evento.preventDefault();
        inicio.focus();
      }
    };

    document.addEventListener('keydown', alTeclear);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.classList.remove('sin-scroll');
      previo?.focus?.();
    };
  }, [abierto]);

  if (!abierto) return null;

  return createPortal(
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onCerrar?.()}>
      <div className={`modal__panel modal__panel--${ancho}`} role="dialog" aria-modal="true" aria-labelledby={idTitulo} ref={panelRef}>
        <header className="modal__header">
          <div>
            <h2 id={idTitulo} className="modal__titulo">
              {titulo}
            </h2>
            {descripcion && <p className="modal__descripcion">{descripcion}</p>}
          </div>
          <Button variante="ghost" soloIcono onClick={onCerrar} aria-label="Cerrar">
            <X size={20} />
          </Button>
        </header>
        <div className="modal__body">{children}</div>
        {pie && <footer className="modal__footer">{pie}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ abierto, onCerrar, onConfirmar, titulo, mensaje, textoConfirmar = 'Confirmar', peligroso, cargando }) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      ancho="sm"
      pie={
        <>
          <Button variante="ghost" onClick={onCerrar} disabled={cargando}>
            Volver
          </Button>
          <Button variante={peligroso ? 'danger' : 'primary'} onClick={onConfirmar} cargando={cargando}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p className="texto-secundario">{mensaje}</p>
    </Modal>
  );
}
