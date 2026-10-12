import { useState } from 'react';
import { Buildings, MapPin, PencilSimple, Phone, Plus, Trash } from '@phosphor-icons/react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { useFormulario } from '../../hooks/useFormulario';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { AdminCabecera, ErroresServidor } from './AdminComun';
import { TIPOS_SALA } from '../../utils/format';
import { reglas } from '../../utils/validacion';

const ESQUEMA_CINE = {
  nombre: [reglas.requerido('Ingresá el nombre.'), reglas.max(120)],
  direccion: [reglas.requerido('Ingresá la dirección.'), reglas.max(160)],
  ciudad: [reglas.requerido('Ingresá la ciudad.'), reglas.max(80)],
  telefono: [reglas.max(40)],
};

const ESQUEMA_SALA = {
  nombre: [reglas.requerido('Ingresá el nombre.'), reglas.max(80)],
  numero: [reglas.requerido('Ingresá el número.'), reglas.numeroMin(1, 'Debe ser 1 o más.')],
  tipo: [reglas.requerido('Elegí el tipo de sala.')],
  cantidadFilas: [reglas.requerido('Ingresá la cantidad de filas.'), reglas.numeroMin(1, 'Mínimo 1 fila.'), reglas.numeroMax(26, 'Máximo 26 filas (A a Z).')],
  butacasPorFila: [reglas.requerido('Ingresá las butacas por fila.'), reglas.numeroMin(1, 'Mínimo 1 butaca.'), reglas.numeroMax(40, 'Máximo 40 butacas por fila.')],
};

function FormularioCine({ inicial, onGuardado, onCerrar }) {
  const toast = useToast();
  const form = useFormulario(inicial ?? { nombre: '', direccion: '', ciudad: '', telefono: '' }, ESQUEMA_CINE);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setErrorServidor(null);
    if (!form.validarTodo()) return;
    setGuardando(true);
    const v = form.valores;
    const dto = { nombre: v.nombre.trim(), direccion: v.direccion.trim(), ciudad: v.ciudad.trim(), telefono: v.telefono?.trim() || null };
    try {
      if (inicial?.id) await api.cines.actualizar(inicial.id, dto);
      else await api.cines.crear(dto);
      toast.exito(inicial?.id ? 'Cine actualizado' : 'Cine creado', dto.nombre);
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
      titulo={inicial?.id ? 'Editar cine' : 'Nuevo cine'}
      pie={
        <>
          <Button variante="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-cine" cargando={guardando}>
            Guardar cine
          </Button>
        </>
      }
    >
      <form id="form-cine" className="form" onSubmit={guardar} noValidate ref={form.formRef}>
        <ErroresServidor error={errorServidor} />
        <Field etiqueta="Nombre" error={form.errores.nombre} requerido>
          <input className="input" {...form.props('nombre')} />
        </Field>
        <Field etiqueta="Dirección" error={form.errores.direccion} requerido>
          <input className="input" autoComplete="street-address" {...form.props('direccion')} />
        </Field>
        <div className="form__fila">
          <Field etiqueta="Ciudad" error={form.errores.ciudad} requerido>
            <input className="input" {...form.props('ciudad')} />
          </Field>
          <Field etiqueta="Teléfono" error={form.errores.telefono}>
            <input className="input" type="tel" {...form.props('telefono')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

function VistaPreviaSala({ filas, porFila }) {
  const f = Math.min(Number(filas) || 0, 26);
  const c = Math.min(Number(porFila) || 0, 40);
  if (!f || !c) return <p className="texto-secundario">Completá filas y butacas para ver la distribución.</p>;
  return (
    <div className="preview-sala" aria-hidden="true">
      <div className="preview-sala__pantalla" />
      <div className="preview-sala__grid" style={{ gridTemplateColumns: `repeat(${c}, 1fr)` }}>
        {Array.from({ length: f * c }, (_, i) => (
          <span key={i} className={(i % c) + 1 <= 2 ? 'preview-sala__vip' : ''} />
        ))}
      </div>
    </div>
  );
}

function FormularioSala({ cine, onGuardado, onCerrar }) {
  const toast = useToast();
  const siguienteNumero = Math.max(0, ...cine.salas.map((s) => s.numero)) + 1;
  const form = useFormulario(
    { nombre: `Sala ${siguienteNumero}`, numero: String(siguienteNumero), tipo: 'TRADICIONAL', cantidadFilas: '8', butacasPorFila: '12' },
    ESQUEMA_SALA,
  );
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const v = form.valores;
  const capacidad = (Number(v.cantidadFilas) || 0) * (Number(v.butacasPorFila) || 0);

  const guardar = async (e) => {
    e.preventDefault();
    setErrorServidor(null);
    if (!form.validarTodo()) return;
    setGuardando(true);
    try {
      await api.cines.agregarSala(cine.id, {
        nombre: v.nombre.trim(),
        numero: Number(v.numero),
        tipo: v.tipo,
        cantidadFilas: Number(v.cantidadFilas),
        butacasPorFila: Number(v.butacasPorFila),
      });
      toast.exito('Sala creada', `${v.nombre} · ${capacidad} butacas`);
      onGuardado();
    } catch (err) {
      setErrorServidor(err.status === 409 ? { message: `Ya existe una sala con el número ${v.numero} en este cine.` } : err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={`Nueva sala en ${cine.nombre}`}
      descripcion="Las butacas se generan automáticamente. Las dos primeras de cada fila son VIP."
      ancho="lg"
      pie={
        <>
          <Button variante="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-sala" cargando={guardando}>
            Crear sala
          </Button>
        </>
      }
    >
      <form id="form-sala" className="form" onSubmit={guardar} noValidate ref={form.formRef}>
        <ErroresServidor error={errorServidor} />
        <div className="form__fila form__fila--3">
          <Field etiqueta="Nombre" error={form.errores.nombre} requerido>
            <input className="input" {...form.props('nombre')} />
          </Field>
          <Field etiqueta="Número" error={form.errores.numero} requerido>
            <input className="input" type="number" min={1} {...form.props('numero')} />
          </Field>
          <Field etiqueta="Tipo" error={form.errores.tipo} requerido>
            <select className="input" {...form.props('tipo')}>
              {Object.entries(TIPOS_SALA).map(([valor, etiqueta]) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="form__fila">
          <Field etiqueta="Cantidad de filas" error={form.errores.cantidadFilas} requerido ayuda="Hasta 26 (A–Z)">
            <input className="input" type="number" min={1} max={26} {...form.props('cantidadFilas')} />
          </Field>
          <Field etiqueta="Butacas por fila" error={form.errores.butacasPorFila} requerido>
            <input className="input" type="number" min={1} max={40} {...form.props('butacasPorFila')} />
          </Field>
        </div>
        <div className="preview-sala__contenedor">
          <p className="field__label">
            Vista previa · <strong>{capacidad}</strong> butacas
          </p>
          <VistaPreviaSala filas={v.cantidadFilas} porFila={v.butacasPorFila} />
        </div>
      </form>
    </Modal>
  );
}

export default function AdminCines() {
  const toast = useToast();
  const { data, loading, error, recargar } = useFetch(() => api.cines.listar());
  const [editandoCine, setEditandoCine] = useState(null);
  const [nuevaSala, setNuevaSala] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.cines.eliminar(aEliminar.id);
      toast.exito('Cine dado de baja', aEliminar.nombre);
      setAEliminar(null);
      recargar();
    } catch (err) {
      toast.error('No se pudo dar de baja', err.message);
    } finally {
      setEliminando(false);
    }
  };

  if (loading && !data) return <PageLoader />;
  if (error) return <ErrorState error={error} onReintentar={recargar} />;

  return (
    <>
      <AdminCabecera titulo="Cines y salas" descripcion="Administrá los complejos y la configuración de sus salas.">
        <Button onClick={() => setEditandoCine({})}>
          <Plus size={18} aria-hidden="true" /> Nuevo cine
        </Button>
      </AdminCabecera>

      {data.length === 0 ? (
        <EmptyState icono={Buildings} titulo="No hay cines cargados" descripcion="Creá el primer cine para poder agregarle salas." />
      ) : (
        <div className="admin-cines">
          {data.map((cine) => (
            <article key={cine.id} className="panel admin-cine">
              <header className="admin-cine__cabecera">
                <span className="cine-card__icono" aria-hidden="true">
                  <Buildings size={26} />
                </span>
                <div className="admin-cine__datos">
                  <h2 className="panel__titulo">{cine.nombre}</h2>
                  <p className="con-icono texto-secundario">
                    <MapPin size={15} aria-hidden="true" /> {cine.direccion}, {cine.ciudad}
                  </p>
                  {cine.telefono && (
                    <p className="con-icono texto-secundario">
                      <Phone size={15} aria-hidden="true" /> {cine.telefono}
                    </p>
                  )}
                </div>
                <div className="tabla__acciones">
                  <Button
                    variante="ghost"
                    tamano="sm"
                    soloIcono
                    aria-label={`Editar ${cine.nombre}`}
                    onClick={() => setEditandoCine({ id: cine.id, nombre: cine.nombre, direccion: cine.direccion, ciudad: cine.ciudad, telefono: cine.telefono ?? '' })}
                  >
                    <PencilSimple size={18} />
                  </Button>
                  <Button variante="ghost" tamano="sm" soloIcono aria-label={`Dar de baja ${cine.nombre}`} onClick={() => setAEliminar(cine)}>
                    <Trash size={18} />
                  </Button>
                </div>
              </header>

              <div className="admin-cine__salas">
                <div className="panel__cabecera">
                  <h3 className="admin-cine__subtitulo">Salas ({cine.salas.length})</h3>
                  <Button variante="secondary" tamano="sm" onClick={() => setNuevaSala(cine)}>
                    <Plus size={16} aria-hidden="true" /> Agregar sala
                  </Button>
                </div>
                {cine.salas.length === 0 ? (
                  <p className="texto-secundario">Este cine todavía no tiene salas.</p>
                ) : (
                  <ul className="salas-grid">
                    {cine.salas.map((s) => (
                      <li key={s.id} className={`sala-chip ${s.activa ? '' : 'sala-chip--inactiva'}`}>
                        <span className="sala-chip__numero">{s.numero}</span>
                        <div>
                          <strong>{s.nombre}</strong>
                          <span className="tabla__sub">
                            {TIPOS_SALA[s.tipo]} · {s.capacidad} butacas{s.activa ? '' : ' · inactiva'}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editandoCine && (
        <FormularioCine
          inicial={editandoCine.id ? editandoCine : null}
          onCerrar={() => setEditandoCine(null)}
          onGuardado={() => {
            setEditandoCine(null);
            recargar();
          }}
        />
      )}
      {nuevaSala && (
        <FormularioSala
          cine={nuevaSala}
          onCerrar={() => setNuevaSala(null)}
          onGuardado={() => {
            setNuevaSala(null);
            recargar();
          }}
        />
      )}
      <ConfirmDialog
        abierto={Boolean(aEliminar)}
        onCerrar={() => setAEliminar(null)}
        onConfirmar={eliminar}
        cargando={eliminando}
        peligroso
        titulo={`¿Dar de baja ${aEliminar?.nombre}?`}
        mensaje="El cine dejará de mostrarse en el sitio. Es una baja lógica: sus funciones y compras se conservan."
        textoConfirmar="Dar de baja"
      />
    </>
  );
}
