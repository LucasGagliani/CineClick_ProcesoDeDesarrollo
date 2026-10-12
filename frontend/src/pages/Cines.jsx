import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Buildings, CalendarBlank, MapPin, Phone } from '@phosphor-icons/react';
import { api } from '../api';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Poster from '../components/ui/Poster';
import Badge from '../components/ui/Badge';
import Chips from '../components/ui/Chips';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { FORMATOS, TIPOS_SALA, claveDia, etiquetaDia, formatearHora } from '../utils/format';
import { agruparPor, diasDisponibles, funcionVendible, ordenarPorInicio } from '../utils/negocio';

export default function Cines() {
  useDocumentTitle('Cines');
  const { data, loading, error, recargar } = useFetch(() => Promise.all([api.cines.listar(), api.funciones.listar(), api.peliculas.listar()]));
  const [ciudad, setCiudad] = useState('todas');
  const [cineId, setCineId] = useState(null);
  const [dia, setDia] = useState(null);

  const cines = useMemo(() => (data ? data[0].filter((c) => ciudad === 'todas' || c.ciudad === ciudad) : []), [data, ciudad]);
  const ciudades = data ? [...new Set(data[0].map((c) => c.ciudad))] : [];

  useEffect(() => {
    if (cines.length > 0 && !cines.some((c) => c.id === cineId)) setCineId(cines[0].id);
  }, [cines, cineId]);

  const funcionesCine = useMemo(
    () => (data ? ordenarPorInicio(data[1].filter((f) => f.cineId === cineId && funcionVendible(f))) : []),
    [data, cineId],
  );
  const dias = diasDisponibles(funcionesCine);

  useEffect(() => {
    if (dias.length > 0 && !dias.includes(dia)) setDia(dias[0]);
  }, [dias, dia]);

  if (loading && !data) return <PageLoader etiqueta="Cargando cines…" />;
  if (error) {
    return (
      <div className="contenedor seccion seccion--offset">
        <ErrorState error={error} onReintentar={recargar} />
      </div>
    );
  }

  const peliculasPorId = new Map(data[2].map((p) => [p.id, p]));
  const cine = cines.find((c) => c.id === cineId);
  const delDia = agruparPor(funcionesCine.filter((f) => claveDia(f.fechaHoraInicio) === dia), 'peliculaId');

  return (
    <div className="contenedor seccion seccion--offset">
      <header className="pagina__cabecera">
        <p className="sobretitulo">Complejos</p>
        <h1 className="titulo-pagina">Nuestros cines</h1>
        <p className="texto-secundario">Elegí un cine para ver su cartelera del día.</p>
      </header>

      {ciudades.length > 1 && (
        <Chips
          etiqueta="Filtrar por ciudad"
          valor={ciudad}
          onCambiar={setCiudad}
          opciones={[{ valor: 'todas', etiqueta: 'Todas las ciudades' }, ...ciudades.map((c) => ({ valor: c, etiqueta: c }))]}
        />
      )}

      {cines.length === 0 ? (
        <EmptyState icono={Buildings} titulo="No hay cines disponibles" />
      ) : (
        <div className="cines-layout">
          <div className="cines-lista" role="radiogroup" aria-label="Elegir cine">
            {cines.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={c.id === cineId}
                className={`cine-card cine-card--seleccionable ${c.id === cineId ? 'cine-card--activa' : ''}`}
                onClick={() => setCineId(c.id)}
              >
                <span className="cine-card__icono" aria-hidden="true">
                  <Buildings size={26} />
                </span>
                <span>
                  <span className="cine-card__nombre">{c.nombre}</span>
                  <span className="con-icono texto-secundario">
                    <MapPin size={15} aria-hidden="true" /> {c.direccion}, {c.ciudad}
                  </span>
                  {c.telefono && (
                    <span className="con-icono texto-secundario">
                      <Phone size={15} aria-hidden="true" /> {c.telefono}
                    </span>
                  )}
                  <span className="cine-card__salas">
                    {c.salas
                      .filter((s) => s.activa)
                      .map((s) => (
                        <span key={s.id} className="etiqueta-formato">
                          {s.nombre} · {TIPOS_SALA[s.tipo]} · {s.capacidad} butacas
                        </span>
                      ))}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <section className="cines-cartelera" aria-labelledby="titulo-cartelera-cine">
            <h2 id="titulo-cartelera-cine" className="titulo-seccion">
              Cartelera de {cine?.nombre}
            </h2>
            {funcionesCine.length === 0 ? (
              <EmptyState icono={CalendarBlank} titulo="Sin funciones próximas" descripcion="Este cine no tiene funciones a la venta por ahora." />
            ) : (
              <>
                <Chips etiqueta="Elegir día" valor={dia} onCambiar={setDia} opciones={dias.map((d) => ({ valor: d, etiqueta: etiquetaDia(d) }))} />
                <div className="cartelera-cine">
                  {[...delDia].map(([peliculaId, lista]) => {
                    const pelicula = peliculasPorId.get(peliculaId);
                    return (
                      <article key={peliculaId} className="cartelera-cine__item">
                        <Link to={`/peliculas/${peliculaId}`} className="cartelera-cine__poster" tabIndex={-1} aria-hidden="true">
                          <Poster src={pelicula?.urlPoster} titulo={lista[0].peliculaTitulo} />
                        </Link>
                        <div>
                          <h3 className="cartelera-cine__titulo">
                            <Link to={`/peliculas/${peliculaId}`}>{lista[0].peliculaTitulo}</Link>
                          </h3>
                          {pelicula && <Badge tono="outline">{pelicula.clasificacion}</Badge>}
                          <div className="horarios__lista">
                            {lista.map((f) => (
                              <Link key={f.id} to={`/comprar/${f.id}`} className="horario">
                                <strong>{formatearHora(f.fechaHoraInicio)}</strong>
                                <span>
                                  {FORMATOS[f.formato]} · {f.idioma}
                                </span>
                                <small>{f.salaNombre}</small>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
