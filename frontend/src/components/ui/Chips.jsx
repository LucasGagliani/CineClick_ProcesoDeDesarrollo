export default function Chips({ opciones, valor, onCambiar, etiqueta, className = '' }) {
  return (
    <div className={`chips ${className}`.trim()} role="radiogroup" aria-label={etiqueta}>
      {opciones.map((opcion) => {
        const activo = opcion.valor === valor;
        return (
          <button
            key={String(opcion.valor)}
            type="button"
            role="radio"
            aria-checked={activo}
            className={`chip ${activo ? 'chip--activo' : ''}`}
            onClick={() => onCambiar(opcion.valor)}
          >
            {opcion.etiqueta}
            {opcion.extra !== undefined && <span className="chip__extra">{opcion.extra}</span>}
          </button>
        );
      })}
    </div>
  );
}
