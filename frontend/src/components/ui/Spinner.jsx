export default function Spinner({ tamano = 20, etiqueta }) {
  return (
    <span
      className="spinner"
      style={{ width: tamano, height: tamano }}
      role={etiqueta ? 'status' : undefined}
      aria-label={etiqueta}
      aria-hidden={etiqueta ? undefined : true}
    />
  );
}

export function PageLoader({ etiqueta = 'Cargando…' }) {
  return (
    <div className="page-loader">
      <Spinner tamano={36} etiqueta={etiqueta} />
      <p>{etiqueta}</p>
    </div>
  );
}
