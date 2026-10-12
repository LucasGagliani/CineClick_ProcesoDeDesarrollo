export default function Badge({ tono = 'neutral', children, className = '', ...resto }) {
  return (
    <span className={`badge badge--${tono} ${className}`.trim()} {...resto}>
      {children}
    </span>
  );
}

export function EstadoBadge({ estado, mapa }) {
  const info = mapa[estado] ?? { texto: estado, tono: 'neutral' };
  return (
    <Badge tono={info.tono}>
      <span className="badge__punto" aria-hidden="true" />
      {info.texto}
    </Badge>
  );
}
