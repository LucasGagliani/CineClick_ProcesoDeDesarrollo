import { useMemo, useState } from 'react';
import { PencilSimple, Plus, Trash } from '@phosphor-icons/react';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { useFormulario } from '../../hooks/useFormulario';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Poster from '../../components/ui/Poster';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { AdminCabecera, Buscador, ErroresServidor, normalizar } from './AdminComun';
import { FORMATOS, GENEROS, formatearDuracion, formatearFecha } from '../../utils/format';
import { reglas } from '../../utils/validacion';

const VACIA = {
  titulo: '',
  sinopsis: '',
  duracionMinutos: '',
  clasificacion: '',
  genero: '',
  idioma: '',
  formatosDisponibles: [],
  urlPoster: '',
  fechaEstreno: '',
};

const ESQUEMA = {
  titulo: [reglas.requerido('Ingresá el título.'), reglas.max(120)],
  sinopsis: [reglas.requerido('Ingresá la sinopsis.'), reglas.max(1200)],
  duracionMinutos: [reglas.requerido('Ingresá la duración.'), reglas.numeroMin(1, 'La duración debe ser mayor a cero.')],
  clasificacion: [reglas.requerido('Ingresá la clasificación.'), reglas.max(20)],
  genero: [reglas.requerido('Elegí un género.')],
  idioma: [reglas.requerido('Ingresá el idioma.'), reglas.max(40)],
  formatosDisponibles: [(v) => (!v || v.length === 0 ? 'Elegí al menos un formato.' : null)],
  urlPoster: [reglas.max(500)],
};

const CLASIFICACIONES = ['ATP', '+13', '+16', '+18'];

function FormularioPelicula({ inicial, onGuardado, onCerrar }) {
  const toast = useToast();
  const form = useFormulario(inicial ?? VACIA, ESQUEMA);
  const [guardando, setGuardando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const v = form.valores;

  const alternarFormato = (f) =>
    form.asignar('formatosDisponibles', v.formatosDisponibles.includes(f) ? v.formatosDisponibles.filter((x) => x !== f) : [...v.formatosDisponibles, f]);

  const guardar = async (e) => {
    e.preventDefault();
    setErrorServidor(null);
    if (!form.validarTodo()) return;
    setGuardando(true);
    const dto = {
      ...v,
      titulo: v.titulo.trim(),
      duracionMinutos: Number(v.duracionMinutos),
      urlPoster: v.urlPoster.trim() || null,
      fechaEstreno: v.fechaEstreno || null,
    };
    try {
      const guardada = inicial?.id ? await api.peliculas.actualizar(inicial.id, dto) : await api.peliculas.crear(dto);
      toast.exito(inicial?.id ? 'Película actualizada' : 'Película creada', guardada.titulo);
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
      titulo={inicial?.id ? 'Editar película' : 'Nueva película'}
      ancho="lg"
      pie={
        <>
          <Button variante="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-pelicula" cargando={guardando}>
            Guardar película
          </Button>
        </>
      }
    >
      <form id="form-pelicula" className="form form--con-preview" onSubmit={guardar} noValidate ref={form.formRef}>
        <div className="form__preview">
          <Poster src={v.urlPoster} titulo={v.titulo || 'Sin título'} cargaDiferida={false} />
        </div>
        <div className="form__campos">
          <ErroresServidor error={errorServidor} />
          <Field etiqueta="Título" error={form.errores.titulo} requerido>
            <input className="input" {...form.props('titulo')} />
          </Field>
          <Field etiqueta="Sinopsis" error={form.errores.sinopsis} requerido ayuda={`${v.sinopsis.length}/1200 caracteres`}>
            <textarea className="input" rows={4} {...form.props('sinopsis')} />
          </Field>
          <div className="form__fila form__fila--3">
            <Field etiqueta="Duración (min)" error={form.errores.duracionMinutos} requerido>
              <input className="input" type="number" min={1} inputMode="numeric" {...form.props('duracionMinutos')} />
            </Field>
            <Field etiqueta="Clasificación" error={form.errores.clasificacion} requerido>
              <input className="input" list="clasificaciones" {...form.props('clasificacion')} />
            </Field>
            <Field etiqueta="Género" error={form.errores.genero} requerido>
              <select className="input" {...form.props('genero')}>
                <option value="">Elegir…</option>
                {Object.entries(GENEROS).map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <datalist id="clasificaciones">
            {CLASIFICACIONES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="form__fila">
            <Field etiqueta="Idioma" error={form.errores.idioma} requerido ayuda="Ej: Castellano, Subtitulada">
              <input className="input" {...form.props('idioma')} />
            </Field>
            <Field etiqueta="Fecha de estreno">
              <input className="input" type="date" {...form.props('fechaEstreno')} />
            </Field>
          </div>
          <fieldset className={`field ${form.errores.formatosDisponibles ? 'field--error' : ''}`}>
            <legend className="field__label">
              Formatos disponibles<span className="field__requerido" aria-hidden="true">*</span>
            </legend>
            <div className="chips">
              {Object.entries(FORMATOS).map(([valor, etiqueta]) => (
                <label key={valor} className={`chip ${v.formatosDisponibles.includes(valor) ? 'chip--activo' : ''}`}>
                  <input type="checkbox" className="sr-only" checked={v.formatosDisponibles.includes(valor)} onChange={() => alternarFormato(valor)} />
                  {etiqueta}
                </label>
              ))}
            </div>
            {form.errores.formatosDisponibles && (
              <p className="field__error" role="alert">
                {form.errores.formatosDisponibles}
              </p>
            )}
          </fieldset>
          <Field etiqueta="URL del póster" error={form.errores.urlPoster} ayuda="Imagen vertical (2:3). Se previsualiza a la izquierda.">
            <input className="input" type="url" placeholder="https://…" {...form.props('urlPoster')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminPeliculas() {
  const toast = useToast();
  const { data, loading, error, recargar } = useFetch(() => api.peliculas.listar());
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const peliculas = useMemo(
    () => (data ?? []).filter((p) => normalizar(p.titulo).includes(normalizar(busqueda.trim()))).sort((a, b) => a.titulo.localeCompare(b.titulo)),
    [data, busqueda],
  );

  const eliminar = async () => {
    setEliminando(true);
    try {
      await api.peliculas.eliminar(aEliminar.id);
      toast.exito('Película dada de baja', aEliminar.titulo);
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
      <AdminCabecera titulo="Películas" descripcion="Las películas activas aparecen en la cartelera pública.">
        <Buscador valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar película…" />
        <Button onClick={() => setEditando({})}>
          <Plus size={18} aria-hidden="true" /> Nueva película
        </Button>
      </AdminCabecera>

      {peliculas.length === 0 ? (
        <EmptyState titulo={busqueda ? 'Sin resultados' : 'No hay películas cargadas'} descripcion={busqueda ? 'Probá con otro título.' : 'Creá la primera película para armar la cartelera.'} />
      ) : (
        <div className="panel panel--sin-padding tabla-scroll">
          <table className="tabla">
            <caption className="sr-only">Listado de películas</caption>
            <thead>
              <tr>
                <th scope="col">Película</th>
                <th scope="col">Género</th>
                <th scope="col">Duración</th>
                <th scope="col">Formatos</th>
                <th scope="col">Estreno</th>
                <th scope="col" className="alinear-derecha">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {peliculas.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="tabla__pelicula">
                      <Poster src={p.urlPoster} titulo={p.titulo} className="tabla__miniatura" />
                      <div>
                        <strong>{p.titulo}</strong>
                        <span className="tabla__sub">
                          {p.clasificacion} · {p.idioma}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{GENEROS[p.genero]}</td>
                  <td className="numero">{formatearDuracion(p.duracionMinutos)}</td>
                  <td>
                    <div className="etiquetas">
                      {p.formatosDisponibles.map((f) => (
                        <span key={f} className="etiqueta-formato">
                          {FORMATOS[f]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{p.fechaEstreno ? formatearFecha(p.fechaEstreno) : '—'}</td>
                  <td>
                    <div className="tabla__acciones">
                      <Button variante="ghost" tamano="sm" soloIcono onClick={() => setEditando(p)} aria-label={`Editar ${p.titulo}`}>
                        <PencilSimple size={18} />
                      </Button>
                      <Button variante="ghost" tamano="sm" soloIcono onClick={() => setAEliminar(p)} aria-label={`Dar de baja ${p.titulo}`}>
                        <Trash size={18} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <FormularioPelicula
          inicial={
            editando.id
              ? { ...editando, urlPoster: editando.urlPoster ?? '', fechaEstreno: editando.fechaEstreno ?? '', duracionMinutos: String(editando.duracionMinutos), formatosDisponibles: [...editando.formatosDisponibles] }
              : null
          }
          onCerrar={() => setEditando(null)}
          onGuardado={() => {
            setEditando(null);
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
        titulo={`¿Dar de baja "${aEliminar?.titulo}"?`}
        mensaje="La película dejará de mostrarse en la cartelera. Es una baja lógica: las compras existentes no se ven afectadas."
        textoConfirmar="Dar de baja"
      />
    </>
  );
}
