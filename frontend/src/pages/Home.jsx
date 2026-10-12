import { useMemo, useState } from 'react';
import { ArrowRight, Buildings, FilmStrip, MapPin, Percent } from '@phosphor-icons/react';
import { api } from '../api';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import HeroCarousel from '../components/cine/HeroCarousel';
import CompraRapida from '../components/cine/CompraRapida';
import Carrusel from '../components/cine/Carrusel';
import FuncionCard from '../components/cine/FuncionCard';
import MovieCard from '../components/cine/MovieCard';
import PromoCard from '../components/cine/PromoCard';
import Chips from '../components/ui/Chips';
import { ButtonLink } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { GENEROS, TIPOS_SALA, claveDia, etiquetaDia } from '../utils/format';
import { diasDisponibles, funcionVendible, ordenarPorInicio, promoVigente } from '../utils/negocio';

function HomeSkeleton() {
  return (
    <>
      <div className="hero hero--skeleton">
        <div className="contenedor hero__contenido">
          <div className="hero__texto">
            <Skeleton style={{ width: 120, height: 14 }} />
            <Skeleton style={{ width: '70%', height: 64 }} />
            <Skeleton style={{ width: '50%', height: 18 }} />
            <Skeleton style={{ width: '90%', height: 60 }} />
          </div>
        </div>
      </div>
      <div className="contenedor seccion">
        <div className="grilla-funciones">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} style={{ aspectRatio: '2 / 3' }} />
          ))}
        </div>
      </div>
    </>
  );
}

export default function Home() {
  useDocumentTitle('Cartelera y entradas');
  const { data, loading, error, recargar } = useFetch(() =>
    Promise.all([api.peliculas.listar(), api.funciones.listar(), api.promociones.listar(), api.cines.listar()]),
  );
  const [dia, setDia] = useState('todos');
  const [genero, setGenero] = useState('todos');

  const vista = useMemo(() => {
    if (!data) return null;
    const [peliculas, funciones, promociones, cines] = data;
    const vendibles = ordenarPorInicio(funciones.filter((f) => funcionVendible(f)));
    const proximaFuncion = new Map();
    const conteo = new Map();
    vendibles.forEach((f) => {
      if (!proximaFuncion.has(f.peliculaId)) proximaFuncion.set(f.peliculaId, f);
      conteo.set(f.peliculaId, (conteo.get(f.peliculaId) ?? 0) + 1);
    });
    const destacadas = [...peliculas]
      .sort((a, b) => (conteo.get(b.id) ?? 0) - (conteo.get(a.id) ?? 0))
      .slice(0, 6);
    return {
      peliculas,
      peliculasPorId: new Map(peliculas.map((p) => [p.id, p])),
      vendibles,
      proximaFuncion,
      conteo,
      destacadas,
      promociones: promociones.filter((p) => promoVigente(p)),
      cines,
    };
  }, [data]);

  if (loading && !data) return <HomeSkeleton />;
  if (error) {
    return (
      <div className="contenedor seccion seccion--offset">
        <ErrorState error={error} onReintentar={recargar} />
      </div>
    );
  }

  const dias = diasDisponibles(vista.vendibles);
  const funcionesDelDia = dia === 'todos' ? vista.vendibles : vista.vendibles.filter((f) => claveDia(f.fechaHoraInicio) === dia);
  const generos = [...new Set(vista.peliculas.map((p) => p.genero))];
  const peliculasFiltradas = genero === 'todos' ? vista.peliculas : vista.peliculas.filter((p) => p.genero === genero);

  return (
    <>
      {vista.destacadas.length > 0 ? (
        <HeroCarousel peliculas={vista.destacadas} proximaFuncion={vista.proximaFuncion} />
      ) : (
        <div className="contenedor seccion seccion--offset">
          <EmptyState titulo="Todavía no hay películas en cartelera" descripcion="Cuando el equipo cargue películas, las vas a ver acá." />
        </div>
      )}

      {vista.vendibles.length > 0 && (
        <div className="contenedor compra-rapida__contenedor">
          <CompraRapida funciones={vista.vendibles} />
        </div>
      )}

      <section className="contenedor seccion" aria-labelledby="titulo-funciones">
        <div className="seccion__cabecera">
          <div>
            <p className="sobretitulo">Elegí tu horario</p>
            <h2 id="titulo-funciones" className="titulo-seccion">
              Próximas funciones
            </h2>
          </div>
          <ButtonLink to="/cartelera" variante="ghost">
            Ver cartelera <ArrowRight size={18} aria-hidden="true" />
          </ButtonLink>
        </div>
        {vista.vendibles.length === 0 ? (
          <EmptyState icono={FilmStrip} titulo="No hay funciones programadas" descripcion="Volvé pronto: estamos armando la próxima cartelera." />
        ) : (
          <>
            <Chips
              etiqueta="Filtrar funciones por día"
              valor={dia}
              onCambiar={setDia}
              opciones={[
                { valor: 'todos', etiqueta: 'Todos los días', extra: vista.vendibles.length },
                ...dias.map((d) => ({
                  valor: d,
                  etiqueta: etiquetaDia(d),
                  extra: vista.vendibles.filter((f) => claveDia(f.fechaHoraInicio) === d).length,
                })),
              ]}
            />
            <Carrusel etiqueta="Próximas funciones">
              {funcionesDelDia.map((f) => (
                <FuncionCard key={f.id} funcion={f} pelicula={vista.peliculasPorId.get(f.peliculaId)} />
              ))}
            </Carrusel>
          </>
        )}
      </section>

      <section className="contenedor seccion" aria-labelledby="titulo-cartelera">
        <div className="seccion__cabecera">
          <div>
            <p className="sobretitulo">Ahora en cines</p>
            <h2 id="titulo-cartelera" className="titulo-seccion">
              En cartelera
            </h2>
          </div>
        </div>
        {generos.length > 1 && (
          <Chips
            etiqueta="Filtrar por género"
            valor={genero}
            onCambiar={setGenero}
            opciones={[{ valor: 'todos', etiqueta: 'Todos' }, ...generos.map((g) => ({ valor: g, etiqueta: GENEROS[g] }))]}
          />
        )}
        <div className="grilla-peliculas">
          {peliculasFiltradas.map((p) => (
            <MovieCard key={p.id} pelicula={p} cantidadFunciones={vista.conteo.get(p.id) ?? 0} />
          ))}
        </div>
      </section>

      {vista.promociones.length > 0 && (
        <section className="seccion seccion--banda" aria-labelledby="titulo-promos">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="sobretitulo sobretitulo--dorado">
                  <Percent size={16} aria-hidden="true" /> Beneficios
                </p>
                <h2 id="titulo-promos" className="titulo-seccion">
                  Promociones vigentes
                </h2>
              </div>
              <ButtonLink to="/promociones" variante="ghost">
                Ver todas <ArrowRight size={18} aria-hidden="true" />
              </ButtonLink>
            </div>
            <div className="grilla-promos">
              {vista.promociones.slice(0, 3).map((p) => (
                <PromoCard key={p.id} promo={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {vista.cines.length > 0 && (
        <section className="contenedor seccion" aria-labelledby="titulo-cines">
          <div className="seccion__cabecera">
            <div>
              <p className="sobretitulo">Encontranos</p>
              <h2 id="titulo-cines" className="titulo-seccion">
                Nuestros cines
              </h2>
            </div>
            <ButtonLink to="/cines" variante="ghost">
              Ver cines <ArrowRight size={18} aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="grilla-cines">
            {vista.cines.map((cine) => (
              <article key={cine.id} className="cine-card">
                <span className="cine-card__icono" aria-hidden="true">
                  <Buildings size={26} />
                </span>
                <div>
                  <h3 className="cine-card__nombre">{cine.nombre}</h3>
                  <p className="con-icono texto-secundario">
                    <MapPin size={15} aria-hidden="true" /> {cine.direccion}, {cine.ciudad}
                  </p>
                  <div className="cine-card__salas">
                    {[...new Set(cine.salas.filter((s) => s.activa).map((s) => s.tipo))].map((t) => (
                      <span key={t} className="etiqueta-formato">
                        {TIPOS_SALA[t]}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
