import { useMemo, useState } from 'react';
import { Info, Prohibit, Receipt, Ticket } from '@phosphor-icons/react';
import { api } from '../../api';
import { cargarComprasDeTodos } from '../../api/agregados';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import Button from '../../components/ui/Button';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import { EstadoBadge } from '../../components/ui/Badge';
import Chips from '../../components/ui/Chips';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import EntradaTicket from '../../components/cine/EntradaTicket';
import { AdminCabecera, Buscador, normalizar } from './AdminComun';
import { ESTADOS_COMPRA, ESTADOS_PAGO, METODOS_PAGO, formatearFechaHora, formatearPrecio, parsearFecha } from '../../utils/format';

export default function AdminCompras() {
  const toast = useToast();
  const { data, loading, error, recargar } = useFetch(async () => {
    const [{ compras }, funciones] = await Promise.all([cargarComprasDeTodos(), api.funciones.listar()]);
    return { compras, funcionesPorId: new Map(funciones.map((f) => [f.id, f])) };
  });
  const [estado, setEstado] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [detalle, setDetalle] = useState(null);
  const [aCancelar, setACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  const compras = useMemo(() => {
    if (!data) return [];
    const termino = normalizar(busqueda.trim().replace(/^#/, ''));
    return [...data.compras]
      .filter((c) => estado === 'todas' || c.estado === estado)
      .filter((c) => !termino || String(c.id) === termino || normalizar(`${c.cliente.nombre} ${c.cliente.apellido} ${c.cliente.email} ${c.peliculaTitulo}`).includes(termino))
      .sort((a, b) => parsearFecha(b.fechaCompra) - parsearFecha(a.fechaCompra));
  }, [data, estado, busqueda]);

  if (loading && !data) return <PageLoader etiqueta="Cargando compras…" />;
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  const contar = (e) => data.compras.filter((c) => c.estado === e).length;

  const cancelar = async () => {
    setCancelando(true);
    try {
      await api.compras.cancelar(aCancelar.id);
      toast.exito('Compra cancelada', `Compra #${aCancelar.id}: se liberaron ${aCancelar.entradas.length} butacas.`);
      setACancelar(null);
      setDetalle(null);
      recargar();
    } catch (err) {
      toast.error('No se pudo cancelar', err.message);
    } finally {
      setCancelando(false);
    }
  };

  return (
    <>
      <AdminCabecera titulo="Compras" descripcion="Ventas de entradas de todos los clientes.">
        <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="N°, cliente o película…" />
      </AdminCabecera>
      <Chips
        etiqueta="Filtrar por estado"
        valor={estado}
        onCambiar={setEstado}
        opciones={[
          { valor: 'todas', etiqueta: 'Todas', extra: data.compras.length },
          { valor: 'CONFIRMADA', etiqueta: 'Confirmadas', extra: contar('CONFIRMADA') },
          { valor: 'PENDIENTE_PAGO', etiqueta: 'Pendientes', extra: contar('PENDIENTE_PAGO') },
          { valor: 'CANCELADA', etiqueta: 'Canceladas', extra: contar('CANCELADA') },
        ]}
      />

      {compras.length === 0 ? (
        <EmptyState icono={Receipt} titulo="No hay compras para mostrar" />
      ) : (
        <div className="panel panel--sin-padding tabla-scroll">
          <table className="tabla">
            <caption className="sr-only">Listado de compras</caption>
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Cliente</th>
                <th scope="col">Función</th>
                <th scope="col">Entradas</th>
                <th scope="col">Pago</th>
                <th scope="col" className="alinear-derecha">
                  Total
                </th>
                <th scope="col">Estado</th>
                <th scope="col" className="alinear-derecha">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {compras.map((c) => {
                const funcion = data.funcionesPorId.get(c.funcionId);
                return (
                  <tr key={c.id}>
                    <td className="numero">#{c.id}</td>
                    <td>
                      <strong>
                        {c.cliente.nombre} {c.cliente.apellido}
                      </strong>
                      <span className="tabla__sub">{c.cliente.email}</span>
                    </td>
                    <td>
                      {c.peliculaTitulo}
                      {funcion && <span className="tabla__sub capitalizar">{formatearFechaHora(funcion.fechaHoraInicio)}</span>}
                    </td>
                    <td>{c.entradas.map((e) => e.codigoButaca).join(', ')}</td>
                    <td>
                      {c.pago ? (
                        <>
                          {METODOS_PAGO[c.pago.metodoPago]}
                          <span className="tabla__sub">{ESTADOS_PAGO[c.pago.estado].texto}</span>
                        </>
                      ) : (
                        <span className="texto-secundario">Sin pago</span>
                      )}
                    </td>
                    <td className="alinear-derecha numero">{formatearPrecio(c.total)}</td>
                    <td>
                      <EstadoBadge estado={c.estado} mapa={ESTADOS_COMPRA} />
                    </td>
                    <td>
                      <div className="tabla__acciones">
                        <Button variante="ghost" tamano="sm" soloIcono onClick={() => setDetalle(c)} aria-label={`Ver entradas de la compra ${c.id}`}>
                          <Ticket size={18} />
                        </Button>
                        <Button variante="ghost" tamano="sm" soloIcono disabled={c.estado === 'CANCELADA'} onClick={() => setACancelar(c)} aria-label={`Cancelar compra ${c.id}`}>
                          <Prohibit size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="nota-pie texto-secundario con-icono">
        <Info size={16} aria-hidden="true" /> El listado se arma consultando las compras de cada cliente, porque el backend no expone un endpoint con todas las compras.
      </p>

      <Modal abierto={Boolean(detalle)} onCerrar={() => setDetalle(null)} titulo={detalle ? `Compra #${detalle.id}` : ''} descripcion={detalle ? `${detalle.cliente.nombre} ${detalle.cliente.apellido} · ${formatearPrecio(detalle.total)}` : ''} ancho="lg">
        {detalle && (
          <div className="tickets">
            {detalle.entradas.map((e) => (
              <EntradaTicket key={e.id} entrada={e} funcion={data.funcionesPorId.get(detalle.funcionId)} peliculaTitulo={detalle.peliculaTitulo} />
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
        titulo={`¿Cancelar la compra #${aCancelar?.id}?`}
        mensaje="Las entradas se anulan y las butacas vuelven a estar disponibles para la venta."
        textoConfirmar="Cancelar compra"
      />
    </>
  );
}
