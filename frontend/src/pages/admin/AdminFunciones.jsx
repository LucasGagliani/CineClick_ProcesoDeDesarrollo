import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Info, PencilSimple, Plus, Prohibit } from '@phosphor-icons/react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { useFormulario } from '../../hooks/useFormulario';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import { EstadoBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { AdminCabecera, ErroresServidor } from './AdminComun';
import {
  ESTADOS_FUNCION,
  FORMATOS,
  TIPOS_SALA,
  aInputDateTime,
  aLocalDateTime,
  formatearFechaCorta,
  formatearHora,
  formatearPrecio,
  parsearFecha,
} from '../../utils/format';
import { funcionVendible, ordenarPorInicio } from '../../utils/negocio';
import { reglas } from '../../utils/validacion';

const ESQUEMA = {
  peliculaId: [reglas.requerido('Elegí una película.')],
  cineId: [reglas.requerido('Elegí un cine.')],
  salaId: [reglas.requerido('Elegí una sala.')],
  fechaHoraInicio: [reglas.requerido('Elegí fecha y hora.'), (v) => (v && new Date(v) <= new Date() ? 'La función tiene que programarse a futuro.' : null)],
  precioBase: [reglas.requerido('Ingresá el precio base.'), reglas.numeroMin(0.01, 'El precio debe ser mayor a cero.')],
  formato: [reglas.requerido('Elegí un formato.')],
  idioma: [reglas.requerido('Ingresá el idioma.'), reglas.max(40)],
};

function FormularioFuncion({ inicial, peliculas, cines, onGuardado, onCerrar }) {
  const toast = useToast();
  const form = useFormulario(
    inicial ?? { peliculaId: '', cineId: '', salaId: '', fechaHoraInicio: '', precioBase: '', formato: '', idioma: '' },
    ESQUEMA,
  );
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const v = form.valores;

  const pelicula = peliculas.find((p) => String(p.id) === String(v.peliculaId));
  const cine = cines.find((c) => String(c.id) === String(v.cineId));
  const salas = cine?.salas.filter((s) => s.activa) ?? [];
  const fin = pelicula && v.fechaHoraInicio ? new Date(new Date(v.fechaHoraInicio).getTime() + (pelicula.duracionMinutos + 20) * 60000) : null;

  const cambiarPelicula = (e) => {
    form.cambiar(e);
    const elegida = peliculas.find((p) => String(p.id) === e.target.value);
    if (!elegida) return;
    if (!elegida.formatosDisponibles.includes(v.formato)) form.asignar('formato', elegida.formatosDisponibles[0] ?? '');
    if (!v.idioma) form.asignar('idioma', elegida.idioma);
  };

  const cambiarCine = (e) => {
    form.cambiar(e);
    form.asignar('salaId', '');
  };

  const guardar = async (e) => {
    e.preventDefault();
    setErrorServidor(null);
    if (!form.validarTodo()) return;
    setGuardando(true);
    const dto = {
      peliculaId: Number(v.peliculaId),
      salaId: Number(v.salaId),
      fechaHoraInicio: aLocalDateTime(new Date(v.fechaHoraInicio)),
      precioBase: Number(v.precioBase),
      formato: v.formato,
      idioma: v.idioma.trim(),
    };
    try {
      if (inicial?.id) await api.funciones.actualizar(inicial.id, dto);
      else await api.funciones.crear(dto);
      toast.exito(inicial?.id ? 'Función actualizada' : 'Función programada', `${pelicula.titulo} · ${formatearFechaCorta(dto.fechaHoraInicio)} ${formatearHora(dto.fechaHoraInicio)}`);
      onGuardado();
    } catch (err) {
      setErrorServidor(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={inicial?.id ? 'Editar función' : 'Nueva función'}
      descripcion="La función no puede superponerse con otra en la misma sala."
      ancho="lg"
      pie={
        <>
          <Button variante="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-funcion" cargando={guardando}>
            {inicial?.id ? 'Guardar cambios' : 'Programar función'}
          </Button>
        </>
      }
    >
      <form id="form-funcion" className="form" onSubmit={guardar} noValidate ref={form.formRef}>
        <ErroresServidor error={errorServidor} />
        <Field etiqueta="Película" error={form.errores.peliculaId} requerido>
          <select className="input" {...form.props('peliculaId')} onChange={cambiarPelicula}>
            <option value="">Elegir película…</option>
            {peliculas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo} ({p.duracionMinutos} min)
              </option>
            ))}
          </select>
        </Field>
        <div className="form__fila">
          <Field etiqueta="Cine" error={form.errores.cineId} requerido>
            <select className="input" {...form.props('cineId')} onChange={cambiarCine}>
              <option value="">Elegir cine…</option>
              {cines.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field etiqueta="Sala" error={form.errores.salaId} requerido>
            <select className="input" {...form.props('salaId')} disabled={!cine}>
              <option value="">{cine ? 'Elegir sala…' : 'Primero elegí un cine'}</option>
              {salas.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {TIPOS_SALA[s.tipo]} · {s.capacidad} butacas
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form__fila">
          <Field etiqueta="Fecha y hora de inicio" error={form.errores.fechaHoraInicio} requerido ayuda={fin ? `Termina ${formatearHora(fin)} (duración + 20 min de limpieza)` : undefined}>
            <input className="input" type="datetime-local" min={aInputDateTime(new Date())} {...form.props('fechaHoraInicio')} />
          </Field>
          <Field etiqueta="Precio base (ARS)" error={form.errores.precioBase} requerido ayuda="VIP +30% · Accesible −20%">
            <input className="input" type="number" min="0.01" step="0.01" inputMode="decimal" {...form.props('precioBase')} />
          </Field>
        </div>
        <div className="form__fila">
          <Field etiqueta="Formato" error={form.errores.formato} requerido ayuda={pelicula ? undefined : 'Depende de la película elegida'}>
            <select className="input" {...form.props('formato')} disabled={!pelicula}>
              <option value="">Elegir formato…</option>
              {(pelicula?.formatosDisponibles ?? []).map((f) => (
                <option key={f} value={f}>
                  {FORMATOS[f]}
                </option>
              ))}
            </select>
          </Field>
          <Field etiqueta="Idioma" error={form.errores.idioma} requerido>
            <input className="input" list="idiomas" {...form.props('idioma')} />
          </Field>
          <datalist id="idiomas">
            <option value="Castellano" />
            <option value="Subtitulada" />
          </datalist>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminFunciones() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error, recargar } = useFetch(() => Promise.all([api.funciones.listar(), api.peliculas.listar(), api.cines.listar()]));
  const [filtros, setFiltros] = useState({ peliculaId: '', cineId: '', estado: 'proximas', fecha: '' });
  const [editando, setEditando] = useState(null);
  const [aCancelar, setACancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    if (params.get('nueva')) {
      setEditando({});
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const funciones = useMemo(() => {
    if (!data) return [];
    return ordenarPorInicio(data[0]).filter((f) => {
      if (filtros.peliculaId && String(f.peliculaId) !== filtros.peliculaId) return false;
      if (filtros.cineId && String(f.cineId) !== filtros.cineId) return false;
      if (filtros.fecha && f.fechaHoraInicio.slice(0, 10) !== filtros.fecha) return false;
      if (filtros.estado === 'proximas') return funcionVendible(f);
      if (filtros.estado === 'pasadas') return f.estado !== 'CANCELADA' && parsearFecha(f.fechaHoraInicio) <= new Date();
      if (filtros.estado && filtros.estado !== 'todas') return f.estado === filtros.estado;
      return true;
    });
  }, [data, filtros]);

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  const [, peliculas, cines] = data;
  const cambiarFiltro = (e) => setFiltros((f) => ({ ...f, [e.target.name]: e.target.value }));

  const cancelar = async () => {
    setCancelando(true);
    try {
      await api.funciones.eliminar(aCancelar.id);
      toast.exito('Función cancelada', `${aCancelar.peliculaTitulo} · ${formatearFechaCorta(aCancelar.fechaHoraInicio)}`);
      setACancelar(null);
      recargar();
    } catch (err) {
      toast.error('No se pudo cancelar', err.message);
    } finally {
      setCancelando(false);
    }
  };

  const editar = (f) =>
    setEditando({
      id: f.id,
      peliculaId: String(f.peliculaId),
      cineId: String(f.cineId),
      salaId: String(f.salaId),
      fechaHoraInicio: aInputDateTime(f.fechaHoraInicio),
      precioBase: String(f.precioBase),
      formato: f.formato,
      idioma: f.idioma,
    });

  return (
    <>
      <AdminCabecera titulo="Funciones" descripcion="Programá, editá o cancelá funciones de cada sala.">
        <Button onClick={() => setEditando({})} disabled={peliculas.length === 0 || cines.length === 0}>
          <Plus size={18} aria-hidden="true" /> Nueva función
        </Button>
      </AdminCabecera>

      <div className="filtros-admin" role="group" aria-label="Filtros de funciones">
        <label>
          <span>Película</span>
          <select className="input" name="peliculaId" value={filtros.peliculaId} onChange={cambiarFiltro}>
            <option value="">Todas</option>
            {peliculas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.titulo}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Cine</span>
          <select className="input" name="cineId" value={filtros.cineId} onChange={cambiarFiltro}>
            <option value="">Todos</option>
            {cines.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Estado</span>
          <select className="input" name="estado" value={filtros.estado} onChange={cambiarFiltro}>
            <option value="proximas">A la venta</option>
            <option value="pasadas">Ya proyectadas</option>
            <option value="CANCELADA">Canceladas</option>
            <option value="todas">Todas</option>
          </select>
        </label>
        <label>
          <span>Fecha</span>
          <input className="input" type="date" name="fecha" value={filtros.fecha} onChange={cambiarFiltro} />
        </label>
      </div>

      {funciones.length === 0 ? (
        <EmptyState titulo="No hay funciones con estos filtros" descripcion="Cambiá los filtros o programá una nueva función." />
      ) : (
        <div className="panel panel--sin-padding tabla-scroll">
          <table className="tabla">
            <caption className="sr-only">Listado de funciones</caption>
            <thead>
              <tr>
                <th scope="col">Película</th>
                <th scope="col">Horario</th>
                <th scope="col">Cine · Sala</th>
                <th scope="col">Formato</th>
                <th scope="col" className="alinear-derecha">
                  Precio base
                </th>
                <th scope="col">Estado</th>
                <th scope="col" className="alinear-derecha">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {funciones.map((f) => {
                const editable = funcionVendible(f);
                return (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.peliculaTitulo}</strong>
                      <span className="tabla__sub">#{f.id}</span>
                    </td>
                    <td>
                      <span className="capitalizar">{formatearFechaCorta(f.fechaHoraInicio)}</span>
                      <span className="tabla__sub numero">
                        {formatearHora(f.fechaHoraInicio)} – {formatearHora(f.fechaHoraFin)}
                      </span>
                    </td>
                    <td>
                      {f.cineNombre}
                      <span className="tabla__sub">{f.salaNombre}</span>
                    </td>
                    <td>
                      <span className="etiqueta-formato">{FORMATOS[f.formato]}</span>
                      <span className="tabla__sub">{f.idioma}</span>
                    </td>
                    <td className="alinear-derecha numero">{formatearPrecio(f.precioBase)}</td>
                    <td>
                      <EstadoBadge estado={f.estado} mapa={ESTADOS_FUNCION} />
                    </td>
                    <td>
                      <div className="tabla__acciones">
                        <Button variante="ghost" tamano="sm" soloIcono disabled={!editable} onClick={() => editar(f)} aria-label={`Editar función ${f.id}`}>
                          <PencilSimple size={18} />
                        </Button>
                        <Button variante="ghost" tamano="sm" soloIcono disabled={f.estado === 'CANCELADA'} onClick={() => setACancelar(f)} aria-label={`Cancelar función ${f.id}`}>
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
        <Info size={16} aria-hidden="true" /> Solo se pueden editar funciones programadas a futuro.
      </p>

      {editando && (
        <FormularioFuncion
          inicial={editando.id ? editando : null}
          peliculas={peliculas}
          cines={cines}
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
            recargar();
          }}
        />
      )}

      <ConfirmDialog
        abierto={Boolean(aCancelar)}
        onCerrar={() => setACancelar(null)}
        onConfirmar={cancelar}
        cargando={cancelando}
        peligroso
        titulo="¿Cancelar esta función?"
        mensaje={aCancelar ? `${aCancelar.peliculaTitulo} · ${formatearFechaCorta(aCancelar.fechaHoraInicio)} ${formatearHora(aCancelar.fechaHoraInicio)} en ${aCancelar.salaNombre}. La función dejará de estar a la venta.` : ''}
        textoConfirmar="Cancelar función"
      />
    </>
  );
}
