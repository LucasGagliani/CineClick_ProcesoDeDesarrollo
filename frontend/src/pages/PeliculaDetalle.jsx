import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarBlank, Clock, FilmStrip, MapPin, Translate } from '@phosphor-icons/react';
import { api } from '../api';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Poster from '../components/ui/Poster';
import Badge from '../components/ui/Badge';
import Chips from '../components/ui/Chips';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { FORMATOS, GENEROS, claveDia, etiquetaDia, formatearDuracion, formatearFecha, formatearHora, formatearPrecio } from '../utils/format';
import { agruparPor, diasDisponibles, funcionVendible, ordenarPorInicio } from '../utils/negocio';

export default function PeliculaDetalle() {
  const { id } = useParams();
  const { data, loading, error, recargar } = useFetch(
    () => Promise.all([api.peliculas.obtener(id), api.funciones.listar({ peliculaId: id })]),
    [id],
  );
  const [dia, setDia] = useState(null);
  const [formato, setFormato] = useState('todos');

  const pelicula = data?.[0];
  useDocumentTitle(pelicula?.titulo);

  const funciones = useMemo(() => (data ? ordenarPorInicio(data[1].filter((f) => funcionVendible(f))) : []), [data]);
  const dias = useMemo(() => diasDisponibles(funciones), [funciones]);

  useEffect(() => {
    if (dias.length > 0 && !dias.includes(dia)) setDia(dias[0]);
  }, [dias, dia]);

  if (loading && !data) return <PageLoader etiqueta="Cargando película…" />;
  if (error) {
    return (
      <div className="contenedor seccion seccion--offset">
        <ErrorState error={error} onReintentar={error.status === 404 ? undefined : recargar} titulo={error.status === 404 ? 'Película no encontrada' : undefined} />
      </div>
    );
  }

  const formatosDelDia = [...new Set(funciones.filter((f) => claveDia(f.fechaHoraInicio) === dia).map((f) => f.formato))];
  const visibles = funciones.filter((f) => claveDia(f.fechaHoraInicio) === dia && (formato === 'todos' || f.formato === formato));
  const porCine = agruparPor(visibles, 'cineNombre');

  return (
    <>
      <section className="detalle-hero">
        <div className="detalle-hero__fondo" style={{ backgroundImage: pelicula.urlPoster ? `url("${pelicula.urlPoster}")` : undefined }} aria-hidden="true" />
        <div className="contenedor detalle-hero__contenido">
          <Link to="/cartelera" className="volver">
            <ArrowLeft size={18} aria-hidden="true" /> Cartelera
          </Link>
          <div className="detalle-hero__grid">
            <div className="detalle-hero__poster">
              <Poster src={pelicula.urlPoster} titulo={pelicula.titulo} cargaDiferida={false} />
            </div>
            <div className="detalle-hero__texto">
              <div className="detalle-hero__badges">
                <Badge tono="outline">{pelicula.clasificacion}</Badge>
                {pelicula.formatosDisponibles.map((f) => (
                  <Badge key={f} tono={f === 'IMAX' || f === 'CUATRO_D' ? 'gold' : 'neutral'}>
                    {FORMATOS[f]}
                  </Badge>
                ))}
              </div>
              <h1 className="detalle-hero__titulo">{pelicula.titulo}</h1>
              <ul className="detalle-hero__meta">
                <li className="con-icono">
                  <FilmStrip size={18} aria-hidden="true" /> {GENEROS[pelicula.genero]}
                </li>
                <li className="con-icono">
                  <Clock size={18} aria-hidden="true" /> {formatearDuracion(pelicula.duracionMinutos)}
                </li>
                <li className="con-icono">
                  <Translate size={18} aria-hidden="true" /> {pelicula.idioma}
                </li>
                {pelicula.fechaEstreno && (
                  <li className="con-icono">
                    <CalendarBlank size={18} aria-hidden="true" /> Estreno {formatearFecha(pelicula.fechaEstreno)}
                  </li>
                )}
              </ul>
              <h2 className="sr-only">Sinopsis</h2>
              <p className="detalle-hero__sinopsis">{pelicula.sinopsis}</p>
              {funciones.length > 0 && (
                <a href="#funciones" className="btn btn--primary btn--lg">
                  Elegir función
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="contenedor seccion" id="funciones" aria-labelledby="titulo-horarios">
        <div className="seccion__cabecera">
          <div>
            <p className="sobretitulo">Paso 1 · Elegí tu función</p>
            <h2 id="titulo-horarios" className="titulo-seccion">
              Horarios
            </h2>
          </div>
        </div>

        {funciones.length === 0 ? (
          <EmptyState icono={CalendarBlank} titulo="Sin funciones programadas" descripcion="Esta película todavía no tiene funciones a la venta. Volvé a consultar más adelante." />
        ) : (
          <>
            <div className="selector-dias" role="tablist" aria-label="Elegir día">
              {dias.map((d) => {
                const fecha = new Date(`${d}T00:00:00`);
                return (
                  <button
                    key={d}
                    type="button"
                    role="tab"
                    aria-selected={d === dia}
                    className={`selector-dias__dia ${d === dia ? 'selector-dias__dia--activo' : ''}`}
                    onClick={() => {
                      setDia(d);
                      setFormato('todos');
                    }}
                  >
                    <span>{['Hoy', 'Mañana'].includes(etiquetaDia(d)) ? etiquetaDia(d) : fecha.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}</span>
                    <strong>{fecha.getDate()}</strong>
                    <span>{fecha.toLocaleDateString('es-AR', { month: 'short' })}</span>
                  </button>
                );
              })}
            </div>

            {formatosDelDia.length > 1 && (
              <Chips
                etiqueta="Filtrar por formato"
                valor={formato}
                onCambiar={setFormato}
                opciones={[{ valor: 'todos', etiqueta: 'Todos' }, ...formatosDelDia.map((f) => ({ valor: f, etiqueta: FORMATOS[f] }))]}
              />
            )}

            <div className="horarios" role="tabpanel">
              {[...porCine].map(([cineNombre, lista]) => (
                <article key={cineNombre} className="horarios__cine">
                  <h3 className="horarios__nombre con-icono">
                    <MapPin size={20} aria-hidden="true" /> {cineNombre}
                  </h3>
                  {[...agruparPor(lista, (f) => `${f.formato}|${f.idioma}`)].map(([clave, grupo]) => {
                    const [fmt, idioma] = clave.split('|');
                    return (
                      <div key={clave} className="horarios__grupo">
                        <p className="horarios__etiqueta">
                          <Badge tono={fmt === 'IMAX' || fmt === 'CUATRO_D' ? 'gold' : 'neutral'}>{FORMATOS[fmt]}</Badge>
                          <span>{idioma}</span>
                        </p>
                        <div className="horarios__lista">
                          {grupo.map((f) => (
                            <Link key={f.id} to={`/comprar/${f.id}`} className="horario" aria-label={`${formatearHora(f.fechaHoraInicio)}, ${f.salaNombre}, desde ${formatearPrecio(f.precioBase)}`}>
                              <strong>{formatearHora(f.fechaHoraInicio)}</strong>
                              <span>{f.salaNombre}</span>
                              <small>{formatearPrecio(f.precioBase)}</small>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
