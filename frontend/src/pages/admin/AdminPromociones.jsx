import { useState } from 'react';
import { Info, Percent, Plus } from '@phosphor-icons/react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { useFormulario } from '../../hooks/useFormulario';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { AdminCabecera, ErroresServidor } from './AdminComun';
import { claveDia, formatearFecha } from '../../utils/format';
import { promoVigente } from '../../utils/negocio';
import { reglas } from '../../utils/validacion';

const ESQUEMA = {
  codigo: [reglas.requerido('Ingresá un código.'), reglas.max(40), (v) => (v && !/^[A-Z0-9_-]+$/.test(v) ? 'Usá letras, números, guiones o guion bajo, sin espacios.' : null)],
  descripcion: [reglas.requerido('Describí la promoción.'), reglas.max(200)],
  porcentajeDescuento: [
    reglas.requerido('Ingresá el porcentaje.'),
    reglas.numeroMin(0.01, 'Debe ser mayor a 0.'),
    reglas.numeroMax(100, 'No puede superar el 100%.'),
  ],
  fechaInicio: [reglas.requerido('Elegí la fecha de inicio.')],
  fechaFin: [reglas.requerido('Elegí la fecha de fin.'), (v, valores) => (v && valores.fechaInicio && v < valores.fechaInicio ? 'La fecha de fin no puede ser anterior al inicio.' : null)],
};

function FormularioPromocion({ onGuardado, onCerrar }) {
  const toast = useToast();
  const hoy = claveDia(new Date());
  const form = useFormulario({ codigo: '', descripcion: '', porcentajeDescuento: '', fechaInicio: hoy, fechaFin: '', activa: true }, ESQUEMA);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const v = form.valores;

  const guardar = async (e) => {
    e.preventDefault();
    setErrorServidor(null);
    if (!form.validarTodo()) return;
    setGuardando(true);
    try {
      await api.promociones.crear({ ...v, descripcion: v.descripcion.trim(), porcentajeDescuento: Number(v.porcentajeDescuento) });
      toast.exito('Promoción creada', v.codigo);
      onGuardado();
    } catch (err) {
      setErrorServidor(err.status === 409 ? { message: `Ya existe una promoción con el código ${v.codigo}.` } : err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Nueva promoción"
      descripcion="Los clientes ingresan el código al comprar y el descuento se aplica sobre el total."
      pie={
        <>
          <Button variante="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-promo" cargando={guardando}>
            Crear promoción
          </Button>
        </>
      }
    >
      <form id="form-promo" className="form" onSubmit={guardar} noValidate ref={form.formRef}>
        <ErroresServidor error={errorServidor} />
        <div className="form__fila">
          <Field etiqueta="Código" error={form.errores.codigo} requerido>
            <input className="input" {...form.props('codigo')} onChange={(e) => form.asignar('codigo', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="Ej: MARTES2X1" />
          </Field>
          <Field etiqueta="Descuento (%)" error={form.errores.porcentajeDescuento} requerido>
            <input className="input" type="number" min="0.01" max="100" step="0.01" inputMode="decimal" {...form.props('porcentajeDescuento')} />
          </Field>
        </div>
        <Field etiqueta="Descripción" error={form.errores.descripcion} requerido>
          <input className="input" {...form.props('descripcion')} placeholder="Ej: 20% off los martes" />
        </Field>
        <div className="form__fila">
          <Field etiqueta="Vigente desde" error={form.errores.fechaInicio} requerido>
            <input className="input" type="date" {...form.props('fechaInicio')} />
          </Field>
          <Field etiqueta="Vigente hasta" error={form.errores.fechaFin} requerido>
            <input className="input" type="date" min={v.fechaInicio} {...form.props('fechaFin')} />
          </Field>
        </div>
        <label className="switch">
          <input type="checkbox" name="activa" checked={v.activa} onChange={form.cambiar} />
          <span className="switch__pista" aria-hidden="true" />
          Promoción activa
        </label>
      </form>
    </Modal>
  );
}

export default function AdminPromociones() {
  const { data, loading, error, recargar } = useFetch(() => api.promociones.listar());
  const [creando, setCreando] = useState(false);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  return (
    <>
      <AdminCabecera titulo="Promociones" descripcion="Códigos de descuento disponibles para los clientes.">
        <Button onClick={() => setCreando(true)}>
          <Plus size={18} aria-hidden="true" /> Nueva promoción
        </Button>
      </AdminCabecera>

      {data.length === 0 ? (
        <EmptyState icono={Percent} titulo="No hay promociones activas" descripcion="Creá un código de descuento para tus clientes." />
      ) : (
        <div className="panel panel--sin-padding tabla-scroll">
          <table className="tabla">
            <caption className="sr-only">Promociones activas</caption>
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Descripción</th>
                <th scope="col" className="alinear-derecha">
                  Descuento
                </th>
                <th scope="col">Vigencia</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => {
                const vigente = promoVigente(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <code className="codigo">{p.codigo}</code>
                    </td>
                    <td>{p.descripcion}</td>
                    <td className="alinear-derecha numero">{Number(p.porcentajeDescuento)}%</td>
                    <td className="numero">
                      {formatearFecha(p.fechaInicio)} – {formatearFecha(p.fechaFin)}
                    </td>
                    <td>
                      <Badge tono={vigente ? 'success' : 'warning'}>
                        <span className="badge__punto" aria-hidden="true" />
                        {vigente ? 'Vigente' : claveDia(p.fechaInicio) > claveDia(new Date()) ? 'Programada' : 'Vencida'}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="nota-pie texto-secundario con-icono">
        <Info size={16} aria-hidden="true" /> El backend solo expone alta y listado de promociones activas: no es posible editarlas ni desactivarlas desde aquí.
      </p>

      {creando && (
        <FormularioPromocion
          onCerrar={() => setCreando(false)}
          onGuardado={() => {
            setCreando(false);
            recargar();
          }}
        />
      )}
    </>
  );
}
