import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from '@phosphor-icons/react';
import { api } from '../../api';
import { cargarComprasDeTodos, cargarOcupacion } from '../../api/agregados';
import { useFetch } from '../../hooks/useFetch';
import { ButtonLink } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { EstadoBadge } from '../../components/ui/Badge';
import { AdminCabecera } from './AdminComun';
import { ESTADOS_COMPRA, FORMATOS, formatearFechaHora, formatearPrecio, parsearFecha } from '../../utils/format';
import { funcionVendible, ordenarPorInicio } from '../../utils/negocio';

const compacto = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });

function StatTile({ etiqueta, valor, detalle, to }) {
  return (
    <Link to={to} className="stat-tile">
      <span className="stat-tile__etiqueta">{etiqueta}</span>
      <span className="stat-tile__valor">{valor}</span>
      {detalle && <span className="stat-tile__detalle">{detalle}</span>}
    </Link>
  );
}

function Medidor({ vendidas, total }) {
  const porcentaje = total === 0 ? 0 : Math.round((vendidas / total) * 100);
  const nivel = porcentaje >= 100 ? 'lleno' : porcentaje >= 75 ? 'alto' : 'normal';
  return (
    <div className="medidor" title={`${vendidas} de ${total} butacas vendidas`}>
      <div
        className={`medidor__pista medidor__pista--${nivel}`}
        role="meter"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={vendidas}
        aria-valuetext={`${porcentaje}% ocupado, ${vendidas} de ${total} butacas`}
      >
        <span className="medidor__relleno" style={{ transform: `scaleX(${porcentaje / 100})` }} />
      </div>
      <span className="medidor__valor numero">
        {porcentaje}% <small>({vendidas}/{total})</small>
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, recargar } = useFetch(async () => {
    const [peliculas, funciones, cines, promociones, { clientes, compras }] = await Promise.all([
      api.peliculas.listar(),
      api.funciones.listar(),
      api.cines.listar(),
      api.promociones.listar(),
      cargarComprasDeTodos(),
    ]);
    const proximas = ordenarPorInicio(funciones.filter((f) => funcionVendible(f))).slice(0, 8);
    const ocupacion = await cargarOcupacion(proximas);
    return { peliculas, funciones, cines, promociones, clientes, compras, proximas, ocupacion };
  });

  const metricas = useMemo(() => {
    if (!data) return null;
    const confirmadas = data.compras.filter((c) => c.estado === 'CONFIRMADA');
    return {
      recaudacion: confirmadas.reduce((s, c) => s + Number(c.total), 0),
      entradas: confirmadas.reduce((s, c) => s + c.entradas.length, 0),
      confirmadas: confirmadas.length,
      pendientes: data.compras.filter((c) => c.estado === 'PENDIENTE_PAGO').length,
      salas: data.cines.reduce((s, c) => s + c.salas.filter((x) => x.activa).length, 0),
      clientesActivos: data.clientes.filter((c) => c.activo).length,
      vendibles: data.funciones.filter((f) => funcionVendible(f)).length,
      recientes: [...data.compras].sort((a, b) => parsearFecha(b.fechaCompra) - parsearFecha(a.fechaCompra)).slice(0, 6),
    };
  }, [data]);

  if (loading && !data) return <PageLoader etiqueta="Cargando resumen…" />;
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  return (
    <>
      <AdminCabecera titulo="Resumen" descripcion="Estado general de la cartelera y las ventas.">
        <ButtonLink to="/admin/funciones?nueva=1">
          <Plus size={18} aria-hidden="true" /> Nueva función
        </ButtonLink>
      </AdminCabecera>

      <section className="dashboard-hero" aria-label="Recaudación">
        <span className="stat-tile__etiqueta">Recaudación por compras confirmadas</span>
        <span className="dashboard-hero__valor">{formatearPrecio(metricas.recaudacion)}</span>
        <span className="stat-tile__detalle">
          {metricas.confirmadas} {metricas.confirmadas === 1 ? 'compra confirmada' : 'compras confirmadas'} · {metricas.pendientes}{' '}
          {metricas.pendientes === 1 ? 'pendiente' : 'pendientes'} de pago
        </span>
      </section>

      <section className="grilla-stats" aria-label="Indicadores">
        <StatTile etiqueta="Entradas vendidas" valor={compacto.format(metricas.entradas)} detalle="En compras confirmadas" to="/admin/compras" />
        <StatTile etiqueta="Funciones a la venta" valor={metricas.vendibles} detalle={`${data.funciones.length} en total`} to="/admin/funciones" />
        <StatTile etiqueta="Películas en cartelera" valor={data.peliculas.length} to="/admin/peliculas" />
        <StatTile etiqueta="Cines activos" valor={data.cines.length} detalle={`${metricas.salas} salas habilitadas`} to="/admin/cines" />
        <StatTile etiqueta="Clientes activos" valor={metricas.clientesActivos} detalle={`${data.clientes.length} registrados`} to="/admin/clientes" />
        <StatTile etiqueta="Promociones activas" valor={data.promociones.length} to="/admin/promociones" />
      </section>

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="titulo-ocupacion">
          <div className="panel__cabecera">
            <h2 id="titulo-ocupacion" className="panel__titulo">
              Ocupación de las próximas funciones
            </h2>
            <Link to="/admin/funciones" className="enlace-con-icono">
              Ver todas <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {data.proximas.length === 0 ? (
            <EmptyState titulo="No hay funciones a la venta" descripcion="Programá una función para empezar a vender entradas." />
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <caption className="sr-only">Ocupación por función</caption>
                <thead>
                  <tr>
                    <th scope="col">Función</th>
                    <th scope="col">Sala</th>
                    <th scope="col" className="tabla__col-medidor">
                      Ocupación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.proximas.map((f) => {
                    const o = data.ocupacion.get(f.id);
                    return (
                      <tr key={f.id}>
                        <td>
                          <strong>{f.peliculaTitulo}</strong>
                          <span className="tabla__sub capitalizar">
                            {formatearFechaHora(f.fechaHoraInicio)} · {FORMATOS[f.formato]}
                          </span>
                        </td>
                        <td>
                          {f.salaNombre}
                          <span className="tabla__sub">{f.cineNombre}</span>
                        </td>
                        <td>
                          <Medidor vendidas={o.vendidas} total={o.total} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="titulo-recientes">
          <div className="panel__cabecera">
            <h2 id="titulo-recientes" className="panel__titulo">
              Últimas compras
            </h2>
            <Link to="/admin/compras" className="enlace-con-icono">
              Ver todas <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          {metricas.recientes.length === 0 ? (
            <EmptyState titulo="Todavía no hay compras" />
          ) : (
            <ul className="lista-simple">
              {metricas.recientes.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.cliente.nombre} {c.cliente.apellido}</strong>
                    <span className="tabla__sub">
                      #{c.id} · {c.peliculaTitulo} · {c.entradas.length} {c.entradas.length === 1 ? 'entrada' : 'entradas'}
                    </span>
                  </div>
                  <div className="lista-simple__derecha">
                    <span className="numero">{formatearPrecio(c.total)}</span>
                    <EstadoBadge estado={c.estado} mapa={ESTADOS_COMPRA} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
