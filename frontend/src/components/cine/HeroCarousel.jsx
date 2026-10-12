import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarBlank, CaretLeft, CaretRight, Clock, Pause, Play, Ticket } from '@phosphor-icons/react';
import Poster from '../ui/Poster';
import Badge from '../ui/Badge';
import { ButtonLink } from '../ui/Button';
import { FORMATOS, GENEROS, etiquetaDia, formatearDuracion, formatearHora } from '../../utils/format';

const INTERVALO_MS = 7000;

function prefiereMenosMovimiento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function HeroCarousel({ peliculas, proximaFuncion }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(prefiereMenosMovimiento);
  const [enFoco, setEnFoco] = useState(false);
  const inicioToque = useRef(null);
  const total = peliculas.length;

  const ir = useCallback((nuevo) => setIndice(((nuevo % total) + total) % total), [total]);

  useEffect(() => {
    if (pausado || enFoco || total < 2) return undefined;
    const id = setTimeout(() => ir(indice + 1), INTERVALO_MS);
    return () => clearTimeout(id);
  }, [indice, pausado, enFoco, total, ir]);

  if (total === 0) return null;

  const alTeclear = (e) => {
    if (e.key === 'ArrowRight') ir(indice + 1);
    if (e.key === 'ArrowLeft') ir(indice - 1);
  };

  const alSoltar = (e) => {
    if (inicioToque.current === null) return;
    const delta = e.changedTouches[0].clientX - inicioToque.current;
    if (Math.abs(delta) > 50) ir(indice + (delta < 0 ? 1 : -1));
    inicioToque.current = null;
  };

  return (
    <section
      className="hero"
      aria-roledescription="carrusel"
      aria-label="Películas destacadas"
      onKeyDown={alTeclear}
      onMouseEnter={() => setEnFoco(true)}
      onMouseLeave={() => setEnFoco(false)}
      onFocus={() => setEnFoco(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setEnFoco(false)}
      onTouchStart={(e) => (inicioToque.current = e.touches[0].clientX)}
      onTouchEnd={alSoltar}
    >
      {peliculas.map((pelicula, i) => {
        const funcion = proximaFuncion.get(pelicula.id);
        const activo = i === indice;
        return (
          <article
            key={pelicula.id}
            className={`hero__slide ${activo ? 'hero__slide--activo' : ''}`}
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${total}: ${pelicula.titulo}`}
            aria-hidden={!activo}
          >
            <div className="hero__fondo" style={{ backgroundImage: pelicula.urlPoster ? `url("${pelicula.urlPoster}")` : undefined }} aria-hidden="true" />
            <div className="hero__velo" aria-hidden="true" />
            <div className="contenedor hero__contenido">
              <div className="hero__texto">
                <p className="hero__sobretitulo">{funcion ? 'En cartelera' : 'Próximamente'}</p>
                <h2 className="hero__titulo">{pelicula.titulo}</h2>
                <div className="hero__meta">
                  <Badge tono="outline">{pelicula.clasificacion}</Badge>
                  <span>{GENEROS[pelicula.genero]}</span>
                  <span className="hero__separador" aria-hidden="true">•</span>
                  <span className="con-icono">
                    <Clock size={16} aria-hidden="true" /> {formatearDuracion(pelicula.duracionMinutos)}
                  </span>
                  <span className="hero__separador" aria-hidden="true">•</span>
                  <span>{pelicula.idioma}</span>
                </div>
                <div className="hero__formatos">
                  {pelicula.formatosDisponibles.map((f) => (
                    <Badge key={f} tono={f === 'IMAX' || f === 'CUATRO_D' ? 'gold' : 'neutral'}>
                      {FORMATOS[f]}
                    </Badge>
                  ))}
                </div>
                <p className="hero__sinopsis">{pelicula.sinopsis}</p>
                {funcion && (
                  <p className="hero__proxima con-icono">
                    <CalendarBlank size={18} aria-hidden="true" />
                    Próxima función: {etiquetaDia(funcion.fechaHoraInicio)} {formatearHora(funcion.fechaHoraInicio)} · {funcion.cineNombre}
                  </p>
                )}
                <div className="hero__acciones">
                  <ButtonLink to={`/peliculas/${pelicula.id}`} tamano="lg" tabIndex={activo ? 0 : -1}>
                    <Ticket size={20} aria-hidden="true" />
                    Comprar entradas
                  </ButtonLink>
                  <ButtonLink to={`/peliculas/${pelicula.id}`} variante="secondary" tamano="lg" tabIndex={activo ? 0 : -1}>
                    Ver detalles
                  </ButtonLink>
                </div>
              </div>
              <Link to={`/peliculas/${pelicula.id}`} className="hero__poster" tabIndex={-1} aria-hidden="true">
                <Poster src={pelicula.urlPoster} titulo={pelicula.titulo} cargaDiferida={i !== 0} />
              </Link>
            </div>
          </article>
        );
      })}

      {total > 1 && (
        <div className="contenedor hero__controles">
          <div className="hero__puntos" role="group" aria-label="Elegir diapositiva">
            {peliculas.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className={`hero__punto ${i === indice ? 'hero__punto--activo' : ''}`}
                aria-label={`Ver ${p.titulo}`}
                aria-current={i === indice}
                onClick={() => ir(i)}
              >
                <span
                  className="hero__progreso"
                  style={{ animationDuration: `${INTERVALO_MS}ms`, animationPlayState: pausado || enFoco ? 'paused' : 'running' }}
                />
              </button>
            ))}
          </div>
          <div className="hero__flechas">
            <button type="button" className="boton-circular" onClick={() => setPausado((v) => !v)} aria-label={pausado ? 'Reanudar carrusel' : 'Pausar carrusel'}>
              {pausado ? <Play size={18} weight="fill" /> : <Pause size={18} weight="fill" />}
            </button>
            <button type="button" className="boton-circular" onClick={() => ir(indice - 1)} aria-label="Película anterior">
              <CaretLeft size={20} />
            </button>
            <button type="button" className="boton-circular" onClick={() => ir(indice + 1)} aria-label="Película siguiente">
              <CaretRight size={20} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
