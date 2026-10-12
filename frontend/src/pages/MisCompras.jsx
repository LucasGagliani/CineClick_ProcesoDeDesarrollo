import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarBlank, CreditCard, MapPin, QrCode, Receipt, Ticket } from '@phosphor-icons/react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Poster from '../components/ui/Poster';
import { EstadoBadge } from '../components/ui/Badge';
import Button, { ButtonLink } from '../components/ui/Button';
import Chips from '../components/ui/Chips';
import Modal, { ConfirmDialog } from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import EntradaTicket from '../components/cine/EntradaTicket';
import { ESTADOS_COMPRA, ESTADOS_PAGO, FORMATOS, METODOS_PAGO, formatearFecha, formatearFechaHora, formatearPrecio, parsearFecha } from '../utils/format';

function categoria(compra, funcion) {
  if (compra.estado === 'CANCELADA') return 'historial';
  if (compra.estado === 'PENDIENTE_PAGO') return 'pendientes';
  if (funcion && parsearFecha(funcion.fechaHoraInicio) < new Date()) return 'historial';
  return 'proximas';
}

export default function MisCompras() {
  useDocumentTitle('Mis compras');
  const { sesion } = useAuth();
  const toast = useToast();
  const { data, loading, error, recargar } = useFetch(
    () => Promise.all([api.clientes.compras(sesion.clienteId), api.funciones.listar(), api.peliculas.listar()]),
    [sesion.clienteId],
  );
  const [filtro, setFiltro] = useState('proximas');
  const [verEntradas, setVerEntradas] = useState(null);
  const [aCancelar, setACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const vista = useMemo(() => {
    if (!data) return null;
    const [compras, funciones, peliculas] = data;
    const funcionesPorId = new Map(funciones.map((f) => [f.id, f]));
    const peliculasPorId = new Map(peliculas.map((p) => [p.id, p]));
    const items = [...compras]
      .sort((a, b) => parsearFecha(b.fechaCompra) - parsearFecha(a.fechaCompra))
      .map((c) => {
        const funcion = funcionesPorId.get(c.funcionId);
        return { compra: c, funcion, pelicula: funcion ? peliculasPorId.get(funcion.peliculaId) : null, categoria: categoria(c, funcion) };
      });
    return { items, funcionesPorId };
  }, [data]);

  if (!sesion.clienteId) {
    return (
      <div className="contenedor seccion seccion--offset">
        <EmptyState icono={Receipt} titulo="Esta cuenta no tiene compras" descripcion="Las cuentas de administrador no compran entradas." />
      </div>
    );
  }
  if (loading && !data) return <PageLoader etiqueta="Cargando tus compras…" />;

  const cancelar = async () => {
    setCancelando(true);
    try {
      await api.compras.cancelar(aCancelar.id);
      toast.exito('Compra cancelada', 'Liberamos tus butacas.');
      setACancelar(null);
      recargar();
    } catch (err) {
      toast.error('No pudimos cancelar la compra', err.message);
    } finally {
      setCancelando(false);
    }
  };

  const contar = (cat) => vista?.items.filter((i) => i.categoria === cat).length ?? 0;
  const visibles = vista?.items.filter((i) => i.categoria === filtro) ?? [];

  return (
    <div className="contenedor seccion seccion--offset">
      <header className="pagina__cabecera">
        <p className="sobretitulo">Mi cuenta</p>
        <h1 className="titulo-pagina">Mis compras</h1>
      </header>

      {error ? (
        <ErrorState error={error} onReintentar={recargar} />
      ) : vista.items.length === 0 ? (
        <EmptyState icono={Ticket} titulo="Todavía no compraste entradas" descripcion="Elegí una película de la cartelera y reservá tu butaca.">
          <ButtonLink to="/cartelera">Ver cartelera</ButtonLink>
        </EmptyState>
      ) : (
        <>
          <Chips
            etiqueta="Filtrar compras"
            valor={filtro}
            onCambiar={setFiltro}
            opciones={[
              { valor: 'proximas', etiqueta: 'Próximas', extra: contar('proximas') },
              { valor: 'pendientes', etiqueta: 'Pendientes de pago', extra: contar('pendientes') },
              { valor: 'historial', etiqueta: 'Historial', extra: contar('historial') },
            ]}
          />
          {visibles.length === 0 ? (
            <EmptyState icono={Receipt} titulo="No hay compras en esta sección" />
          ) : (
            <ul className="lista-compras">
              {visibles.map(({ compra, funcion, pelicula, categoria: cat }) => {
                const pagoRechazado = compra.pago?.estado === 'RECHAZADO';
                const funcionFutura = funcion && parsearFecha(funcion.fechaHoraInicio) > new Date();
                return (
                  <li key={compra.id} className="compra-item">
                    <div className="compra-item__poster">
                      <Poster src={pelicula?.urlPoster} titulo={compra.peliculaTitulo} />
                    </div>
                    <div className="compra-item__info">
                      <div className="compra-item__cabecera">
                        <h2 className="compra-item__titulo">{compra.peliculaTitulo}</h2>
                        <EstadoBadge estado={compra.estado} mapa={ESTADOS_COMPRA} />
                      </div>
                      {funcion && (
                        <ul className="compra-item__datos">
                          <li className="con-icono">
                            <CalendarBlank size={16} aria-hidden="true" /> <span className="capitalizar">{formatearFechaHora(funcion.fechaHoraInicio)}</span>
                          </li>
                          <li className="con-icono">
                            <MapPin size={16} aria-hidden="true" /> {funcion.cineNombre} · {funcion.salaNombre}
                            {!funcion.salaNombre.toUpperCase().includes(FORMATOS[funcion.formato]) && ` · ${FORMATOS[funcion.formato]}`}
                          </li>
                        </ul>
                      )}
                      <p className="compra-item__butacas">
                        Butacas: <strong>{compra.entradas.map((e) => e.codigoButaca).join(', ')}</strong>
                      </p>
                      <p className="texto-secundario compra-item__meta">
                        Compra N° {compra.id} · {formatearFecha(compra.fechaCompra)}
                        {compra.pago && (
                          <>
                            {' · '}
                            <span className="con-icono">
                              <CreditCard size={14} aria-hidden="true" /> {METODOS_PAGO[compra.pago.metodoPago]} ({ESTADOS_PAGO[compra.pago.estado].texto.toLowerCase()})
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="compra-item__acciones">
                      <strong className="compra-item__total numero">{formatearPrecio(compra.total)}</strong>
                      {compra.estado === 'CONFIRMADA' && (
                        <Button tamano="sm" onClick={() => setVerEntradas(compra)}>
                          <QrCode size={18} aria-hidden="true" /> Ver entradas
                        </Button>
                      )}
                      {cat === 'pendientes' && funcionFutura && (
                        <ButtonLink tamano="sm" to={`/comprar/${compra.funcionId}?compra=${compra.id}`}>
                          {pagoRechazado ? 'Reintentar pago' : 'Completar pago'}
                        </ButtonLink>
                      )}
                      {compra.estado !== 'CANCELADA' && funcionFutura && (
                        <Button tamano="sm" variante="ghost" onClick={() => setACancelar(compra)}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <Modal abierto={Boolean(verEntradas)} onCerrar={() => setVerEntradas(null)} titulo={verEntradas ? `Entradas · ${verEntradas.peliculaTitulo}` : ''} descripcion="Mostrá el código QR en el ingreso a la sala." ancho="lg">
        {verEntradas && (
          <div className="tickets">
            {verEntradas.entradas.map((e) => (
              <EntradaTicket key={e.id} entrada={e} funcion={vista?.funcionesPorId.get(verEntradas.funcionId)} peliculaTitulo={verEntradas.peliculaTitulo} />
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        abierto={Boolean(aCancelar)}
        onCerrar={() => setACancelar(null)}
        onConfirmar={cancelar}
        cargando={cancelando}
        peligroso
        titulo="¿Cancelar esta compra?"
        mensaje={
          aCancelar?.estado === 'CONFIRMADA'
            ? 'Las entradas quedarán anuladas y las butacas se liberarán. La devolución del dinero se gestiona en boletería.'
            : 'Las butacas reservadas se liberarán.'
        }
        textoConfirmar="Sí, cancelar compra"
      />

      <p className="texto-secundario nota-pie">
        ¿Buscás otra película? <Link to="/cartelera">Volver a la cartelera</Link>
      </p>
    </div>
  );
}
