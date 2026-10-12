import { useState } from 'react';
import { FilmSlate } from '@phosphor-icons/react';

export default function Poster({ src, titulo, className = '', cargaDiferida = true }) {
  const [fallo, setFallo] = useState(false);

  if (!src || fallo) {
    return (
      <div className={`poster poster--vacio ${className}`.trim()} role="img" aria-label={`Póster de ${titulo}`}>
        <FilmSlate size={36} aria-hidden="true" />
        <span>{titulo}</span>
      </div>
    );
  }

  return (
    <img
      className={`poster ${className}`.trim()}
      src={src}
      alt={`Póster de ${titulo}`}
      loading={cargaDiferida ? 'lazy' : 'eager'}
      decoding="async"
      width="500"
      height="750"
      onError={() => setFallo(true)}
    />
  );
}
