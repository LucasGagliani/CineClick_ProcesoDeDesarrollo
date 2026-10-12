import { Link } from 'react-router-dom';
import { MapPin, Translate } from '@phosphor-icons/react';
import Poster from '../ui/Poster';
import Badge from '../ui/Badge';
import { FORMATOS, etiquetaDia, formatearHora, formatearPrecio } from '../../utils/format';

export default function FuncionCard({ funcion, pelicula }) {
  return (
    <div role="listitem" className="funcion-card">
      <Link to={`/comprar/${funcion.id}`} className="funcion-card__enlace" aria-label={`Comprar ${funcion.peliculaTitulo}, ${etiquetaDia(funcion.fechaHoraInicio)} a las ${formatearHora(funcion.fechaHoraInicio)} en ${funcion.cineNombre}`}>
        <div className="funcion-card__poster">
          <Poster src={pelicula?.urlPoster} titulo={funcion.peliculaTitulo} />
          <span className="funcion-card__hora">
            <small>{etiquetaDia(funcion.fechaHoraInicio)}</small>
            {formatearHora(funcion.fechaHoraInicio)}
          </span>
          <Badge tono={funcion.formato === 'IMAX' || funcion.formato === 'CUATRO_D' ? 'gold' : 'dark'} className="funcion-card__formato">
            {FORMATOS[funcion.formato]}
          </Badge>
        </div>
        <div className="funcion-card__info">
          <h3 className="funcion-card__titulo">{funcion.peliculaTitulo}</h3>
          <p className="con-icono texto-secundario">
            <MapPin size={15} aria-hidden="true" /> {funcion.cineNombre} · {funcion.salaNombre}
          </p>
          <p className="con-icono texto-secundario">
            <Translate size={15} aria-hidden="true" /> {funcion.idioma}
          </p>
          <p className="funcion-card__precio">
            desde <strong>{formatearPrecio(funcion.precioBase)}</strong>
          </p>
        </div>
      </Link>
    </div>
  );
}
