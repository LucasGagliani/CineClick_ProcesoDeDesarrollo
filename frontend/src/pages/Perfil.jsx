import { useEffect, useState } from 'react';
import { FloppyDisk, UserCircle } from '@phosphor-icons/react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFormulario } from '../hooks/useFormulario';
import Field, { PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { formatearFecha } from '../utils/format';
import { reglas } from '../utils/validacion';

const ESQUEMA = {
  nombre: [reglas.requerido('Ingresá tu nombre.'), reglas.max(80)],
  apellido: [reglas.requerido('Ingresá tu apellido.'), reglas.max(80)],
  email: [reglas.requerido('Ingresá tu email.'), reglas.email(), reglas.max(120)],
  telefono: [reglas.max(40)],
  password: [reglas.requerido('Para guardar cambios ingresá tu contraseña actual o una nueva.'), reglas.min(4), reglas.max(120)],
};

export default function Perfil() {
  useDocumentTitle('Mi perfil');
  const { sesion, actualizarSesion } = useAuth();
  const toast = useToast();
  const { data, loading, error, recargar } = useFetch(() => api.clientes.obtener(sesion.clienteId), [sesion.clienteId]);
  const form = useFormulario({ nombre: '', apellido: '', email: '', telefono: '', password: '' }, ESQUEMA);
  const [guardando, setGuardando] = useState(false);
  const { reiniciar } = form;

  useEffect(() => {
    if (data) reiniciar({ nombre: data.nombre, apellido: data.apellido, email: data.email, telefono: data.telefono ?? '', password: '' });
  }, [data]);

  if (!sesion.clienteId) {
    return (
      <div className="contenedor seccion seccion--offset">
        <EmptyState icono={UserCircle} titulo="Perfil de administrador" descripcion="Los datos de las cuentas de administrador se gestionan desde la base de datos." />
      </div>
    );
  }
  if (loading && !data) return <PageLoader etiqueta="Cargando tu perfil…" />;
  if (error) {
    return (
      <div className="contenedor seccion seccion--offset">
        <ErrorState error={error} onReintentar={recargar} />
      </div>
    );
  }

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.validarTodo()) return;
    setGuardando(true);
    try {
      const v = form.valores;
      const actualizado = await api.clientes.actualizar(sesion.clienteId, {
        nombre: v.nombre.trim(),
        apellido: v.apellido.trim(),
        email: v.email.trim(),
        telefono: v.telefono.trim() || null,
        password: v.password,
      });
      actualizarSesion({ nombre: `${actualizado.nombre} ${actualizado.apellido}`, email: actualizado.email });
      form.reiniciar({ ...v, password: '' });
      toast.exito('Perfil actualizado', 'Guardamos tus cambios.');
    } catch (err) {
      if (err.status === 409) form.setErrores((prev) => ({ ...prev, email: 'Ese email ya está en uso por otra cuenta.' }));
      else toast.error('No pudimos guardar los cambios', err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="contenedor seccion seccion--offset perfil">
      <header className="pagina__cabecera">
        <p className="sobretitulo">Mi cuenta</p>
        <h1 className="titulo-pagina">Mi perfil</h1>
        <p className="texto-secundario">Cliente desde el {formatearFecha(data.fechaRegistro)}.</p>
      </header>
      <form className="panel form" onSubmit={guardar} noValidate ref={form.formRef}>
        <fieldset className="form__grupo">
          <legend className="panel__titulo">Datos personales</legend>
          <div className="form__fila">
            <Field etiqueta="Nombre" error={form.errores.nombre} requerido>
              <input className="input" autoComplete="given-name" {...form.props('nombre')} />
            </Field>
            <Field etiqueta="Apellido" error={form.errores.apellido} requerido>
              <input className="input" autoComplete="family-name" {...form.props('apellido')} />
            </Field>
          </div>
          <div className="form__fila">
            <Field etiqueta="Email" error={form.errores.email} requerido>
              <input className="input" type="email" autoComplete="email" {...form.props('email')} />
            </Field>
            <Field etiqueta="Teléfono" error={form.errores.telefono}>
              <input className="input" type="tel" autoComplete="tel" {...form.props('telefono')} />
            </Field>
          </div>
        </fieldset>
        <fieldset className="form__grupo">
          <legend className="panel__titulo">Seguridad</legend>
          <Field etiqueta="Contraseña" error={form.errores.password} requerido ayuda="Por seguridad, ingresá tu contraseña actual para confirmar los cambios o escribí una nueva para reemplazarla.">
            <PasswordInput autoComplete="new-password" {...form.props('password')} />
          </Field>
        </fieldset>
        <div className="panel__acciones">
          <Button type="submit" cargando={guardando}>
            {!guardando && <FloppyDisk size={18} aria-hidden="true" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
