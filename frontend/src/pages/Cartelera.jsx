import { useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { api } from '../api';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import MovieCard from '../components/cine/MovieCard';
import Chips from '../components/ui/Chips';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { FORMATOS, GENEROS } from '../utils/format';
import { funcionVendible } from '../utils/negocio';

const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function Cartelera() {
  useDocumentTitle('Cartelera');
  const { data, loading, error, recargar } = useFetch(() => Promise.all([api.peliculas.listar(), api.funciones.listar()]));
  const [busqueda, setBusqueda] = useState('');
  const [genero, setGenero] = useState('todos');
  const [formato, setFormato] = useState('todos');
  const [soloConFunciones, setSoloConFunciones] = useState(false);

  const conteo = useMemo(() => {
    const mapa = new Map();
    data?.[1].filter((f) => funcionVendible(f)).forEach((f) => mapa.set(f.peliculaId, (mapa.get(f.peliculaId) ?? 0) + 1));
    return mapa;
  }, [data]);

  const peliculas = useMemo(() => {
    if (!data) return [];
    const termino = normalizar(busqueda.trim());
    return data[0]
      .filter((p) => !termino || normalizar(p.titulo).includes(termino))
      .filter((p) => genero === 'todos' || p.genero === genero)
      .filter((p) => formato === 'todos' || p.formatosDisponibles.includes(formato))
      .filter((p) => !soloConFunciones || conteo.has(p.id))
      .sort((a, b) => (conteo.get(b.id) ?? 0) - (conteo.get(a.id) ?? 0) || a.titulo.localeCompare(b.titulo));
  }, [data, busqueda, genero, formato, soloConFunciones, conteo]);

  return (
    <div className="contenedor seccion seccion--offset">
      <header className="pagina__cabecera">
        <p className="sobretitulo">Películas</p>
        <h1 className="titulo-pagina">Cartelera</h1>
        <p className="texto-secundario">Todas las películas disponibles en nuestros cines.</p>
      </header>

      <div className="filtros">
        <label className="buscador">
          <MagnifyingGlass size={20} aria-hidden="true" />
          <span className="sr-only">Buscar película</span>
          <input type="search" placeholder="Buscar por título…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <Chips
          etiqueta="Filtrar por género"
          valor={genero}
          onCambiar={setGenero}
          opciones={[{ valor: 'todos', etiqueta: 'Todos los géneros' }, ...Object.entries(GENEROS).map(([valor, etiqueta]) => ({ valor, etiqueta }))]}
        />
        <div className="filtros__fila">
          <Chips
            etiqueta="Filtrar por formato"
            valor={formato}
            onCambiar={setFormato}
            opciones={[{ valor: 'todos', etiqueta: 'Todos los formatos' }, ...Object.entries(FORMATOS).map(([valor, etiqueta]) => ({ valor, etiqueta }))]}
          />
          <label className="switch">
            <input type="checkbox" checked={soloConFunciones} onChange={(e) => setSoloConFunciones(e.target.checked)} />
            <span className="switch__pista" aria-hidden="true" />
            Solo con funciones
          </label>
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onReintentar={recargar} />
      ) : loading && !data ? (
        <div className="grilla-peliculas">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} style={{ aspectRatio: '2 / 3' }} />
          ))}
        </div>
      ) : peliculas.length === 0 ? (
        <EmptyState titulo="No encontramos películas" descripcion="Probá con otro título o quitá algún filtro." />
      ) : (
        <>
          <p className="texto-secundario resultado-conteo" aria-live="polite">
            {peliculas.length} {peliculas.length === 1 ? 'película' : 'películas'}
          </p>
          <div className="grilla-peliculas">
            {peliculas.map((p) => (
              <MovieCard key={p.id} pelicula={p} cantidadFunciones={conteo.get(p.id) ?? 0} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
