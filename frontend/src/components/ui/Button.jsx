import { Link } from 'react-router-dom';
import Spinner from './Spinner';

function clases({ variante = 'primary', tamano = 'md', bloque, soloIcono, className }) {
  return [
    'btn',
    `btn--${variante}`,
    `btn--${tamano}`,
    bloque && 'btn--block',
    soloIcono && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export default function Button({
  variante,
  tamano,
  bloque,
  soloIcono,
  cargando = false,
  className,
  children,
  type = 'button',
  disabled,
  ...resto
}) {
  return (
    <button
      type={type}
      className={clases({ variante, tamano, bloque, soloIcono, className })}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando && <Spinner tamano={16} />}
      {children}
    </button>
  );
}

export function ButtonLink({ variante, tamano, bloque, soloIcono, className, children, ...resto }) {
  return (
    <Link className={clases({ variante, tamano, bloque, soloIcono, className })} {...resto}>
      {children}
    </Link>
  );
}
