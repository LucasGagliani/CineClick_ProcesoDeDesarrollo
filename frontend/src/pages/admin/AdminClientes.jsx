import { useMemo, useState } from 'react';
import { Eye, UserMinus, Users } from '@phosphor-icons/react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import Button from '../../components/ui/Button';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Badge, { EstadoBadge } from '../../components/ui/Badge';
import Chips from '../../components/ui/Chips';
import Spinner, { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { AdminCabecera, Buscador, normalizar } from './AdminComun';
import { ESTADOS_COMPRA, formatearFecha, formatearPrecio, parsearFecha } from '../../utils/format';

function ComprasDelCliente({ cliente, onCerrar }) {
  const { data, loading, error, recargar } = useFetch(() => api.clientes.compras(cliente.id), [cliente.id]);
  const compras = data ? [...data].sort((a, b) => parsearFecha(b.fechaCompra) - parsearFecha(a.fechaCompra)) : [];
  const total = compras.filter((c) => c.estado === 'CONFIRMADA').reduce((s, c) => s + Number(c.total), 0);

  return (
    <Modal abierto onCerrar={onCerrar} titulo={`${cliente.nombre} ${cliente.apellido}`} descripcion={`${cliente.email}${cliente.telefono ? ` · ${cliente.telefono}` : ''}`} ancho="lg">
      {loading && !data ? (
        <div className="centrado">
          <Spinner tamano={28} etiqueta="Cargando compras" />
        </div>
      ) : error ? (
        <ErrorState error={error} onReintentar={recargar} />
      ) : compras.length === 0 ? (
        <EmptyState titulo="Este cliente todavía no realizó compras" />
      ) : (
        <>
          <p className="texto-secundario">
            {compras.length} compras · {formatearPrecio(total)} en compras confirmadas
          </p>
          <div className="tabla-scroll">
            <table className="tabla tabla--compacta">
              <caption className="sr-only">Compras del cliente</caption>
              <thead>
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Película</th>
                  <th scope="col">Butacas</th>
                  <th scope="col">Fecha</th>
                  <th scope="col" className="alinear-derecha">
                    Total
                  </th>
                  <th scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td className="numero">#{c.id}</td>
                    <td>{c.peliculaTitulo}</td>
                    <td>{c.entradas.map((e) => e.codigoButaca).join(', ')}</td>
                    <td className="numero">{formatearFecha(c.fechaCompra)}</td>
                    <td className="alinear-derecha numero">{formatearPrecio(c.total)}</td>
                    <td>
                      <EstadoBadge estado={c.estado} mapa={ESTADOS_COMPRA} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Modal>
  );
}

export default function AdminClientes() {
  const toast = useToast();
  const { data, loading, error, recargar } = useFetch(() => api.clientes.listar());
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('activos');
  const [viendo, setViendo] = useState(null);
  const [aDesactivar, setADesactivar] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const clientes = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return (data ?? [])
      .filter((c) => estado === 'todos' || (estado === 'activos' ? c.activo : !c.activo))
      .filter((c) => !termino || normalizar(`${c.nombre} ${c.apellido} ${c.email}`).includes(termino))
      .sort((a, b) => parsearFecha(b.fechaRegistro) - parsearFecha(a.fechaRegistro));
  }, [data, busqueda, estado]);

  const desactivar = async () => {
    setProcesando(true);
    try {
      await api.clientes.eliminar(aDesactivar.id);
      toast.exito('Cliente desactivado', `${aDesactivar.nombre} ${aDesactivar.apellido} ya no podrá ingresar.`);
      setADesactivar(null);
      recargar();
    } catch (err) {
      toast.error('No se pudo desactivar', err.message);
    } finally {
      setProcesando(false);
    }
  };

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  return (
    <>
      <AdminCabecera titulo="Clientes" descripcion="Personas registradas en CineClick.">
        <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Nombre o email…" />
      </AdminCabecera>
      <Chips
        etiqueta="Filtrar por estado"
        valor={estado}
        onCambiar={setEstado}
        opciones={[
          { valor: 'activos', etiqueta: 'Activos', extra: data.filter((c) => c.activo).length },
          { valor: 'inactivos', etiqueta: 'Inactivos', extra: data.filter((c) => !c.activo).length },
          { valor: 'todos', etiqueta: 'Todos', extra: data.length },
        ]}
      />

      {clientes.length === 0 ? (
        <EmptyState icono={Users} titulo="No hay clientes para mostrar" />
      ) : (
        <div className="panel panel--sin-padding tabla-scroll">
          <table className="tabla">
            <caption className="sr-only">Listado de clientes</caption>
            <thead>
              <tr>
                <th scope="col">Cliente</th>
                <th scope="col">Email</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Registro</th>
                <th scope="col">Estado</th>
                <th scope="col" className="alinear-derecha">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="tabla__persona">
                      <span className="avatar avatar--sm" aria-hidden="true">
                        {c.nombre[0]}
                        {c.apellido[0]}
                      </span>
                      <strong>
                        {c.nombre} {c.apellido}
                      </strong>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.telefono || '—'}</td>
                  <td className="numero">{formatearFecha(c.fechaRegistro)}</td>
                  <td>
                    <Badge tono={c.activo ? 'success' : 'neutral'}>
                      <span className="badge__punto" aria-hidden="true" />
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td>
                    <div className="tabla__acciones">
                      <Button variante="ghost" tamano="sm" soloIcono onClick={() => setViendo(c)} aria-label={`Ver compras de ${c.nombre} ${c.apellido}`}>
                        <Eye size={18} />
                      </Button>
                      <Button variante="ghost" tamano="sm" soloIcono disabled={!c.activo} onClick={() => setADesactivar(c)} aria-label={`Desactivar a ${c.nombre} ${c.apellido}`}>
                        <UserMinus size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viendo && <ComprasDelCliente cliente={viendo} onCerrar={() => setViendo(null)} />}
      <ConfirmDialog
        abierto={Boolean(aDesactivar)}
        onCerrar={() => setADesactivar(null)}
        onConfirmar={desactivar}
        cargando={procesando}
        peligroso
        titulo="¿Desactivar este cliente?"
        mensaje={`${aDesactivar?.nombre} ${aDesactivar?.apellido} no podrá volver a iniciar sesión. Sus compras se conservan.`}
        textoConfirmar="Desactivar"
      />
    </>
  );
}
