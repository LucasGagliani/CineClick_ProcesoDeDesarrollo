import { Link } from 'react-router-dom';

export default function Logo({ destino = '/', compacto = false }) {
  return (
    <Link to={destino} className="logo" aria-label="CineClick, ir al inicio">
      <svg className="logo__marca" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill="var(--color-primary)" />
        <path d="M14 24h36v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#fff" />
        <path d="M13 15.5 47.6 9l1.5 8-34.6 6.5z" fill="#fff" />
        <path d="m21 14.2 5.6 7.4M31 12.3l5.6 7.4M41 10.4l5.6 7.4" stroke="var(--color-primary)" strokeWidth="3" />
        <path d="m28 31 10 6-10 6z" fill="var(--color-primary)" />
      </svg>
      {!compacto && (
        <span className="logo__texto">
          Cine<span>Click</span>
        </span>
      )}
    </Link>
  );
}
