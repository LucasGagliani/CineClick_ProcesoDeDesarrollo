import { Link } from 'react-router-dom';
import { Clock, Ticket } from '@phosphor-icons/react';
import Poster from '../ui/Poster';
import Badge from '../ui/Badge';
import { FORMATOS, GENEROS, formatearDuracion } from '../../utils/format';

export default function MovieCard({ pelicula, cantidadFunciones = 0 }) {
  return (
    <article className="movie-card">
      <Link to={`/peliculas/${pelicula.id}`} className="movie-card__enlace">
        <div className="movie-card__poster">
          <Poster src={pelicula.urlPoster} titulo={pelicula.titulo} />
          <Badge tono="dark" className="movie-card__clasificacion">
            {pelicula.clasificacion}
          </Badge>
          <div className="movie-card__overlay" aria-hidden="true">
            <span className="btn btn--primary btn--md">
              <Ticket size={18} /> {cantidadFunciones > 0 ? 'Ver funciones' : 'Ver detalles'}
            </span>
          </div>
        </div>
        <div className="movie-card__info">
          <h3 className="movie-card__titulo">{pelicula.titulo}</h3>
          <p className="movie-card__meta">
            <span>{GENEROS[pelicula.genero]}</span>
            <span className="con-icono">
              <Clock size={14} aria-hidden="true" />
              {formatearDuracion(pelicula.duracionMinutos)}
            </span>
          </p>
          <div className="movie-card__formatos">
            {pelicula.formatosDisponibles.map((f) => (
              <span key={f} className="etiqueta-formato">
                {FORMATOS[f]}
              </span>
            ))}
            {cantidadFunciones === 0 && <span className="etiqueta-formato etiqueta-formato--apagada">Sin funciones</span>}
          </div>
        </div>
      </Link>
    </article>
  );
}
