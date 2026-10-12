import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { UserPlus } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFormulario } from '../hooks/useFormulario';
import Field, { PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { reglas } from '../utils/validacion';

const ESQUEMA = {
  nombre: [reglas.requerido('Ingresá tu nombre.'), reglas.max(80)],
  apellido: [reglas.requerido('Ingresá tu apellido.'), reglas.max(80)],
  email: [reglas.requerido('Ingresá tu email.'), reglas.email(), reglas.max(120)],
  telefono: [reglas.max(40)],
  password: [reglas.requerido('Creá una contraseña.'), reglas.min(4), reglas.max(120)],
  confirmacion: [
    reglas.requerido('Repetí la contraseña.'),
    (v, valores) => (v !== valores.password ? 'Las contraseñas no coinciden.' : null),
  ],
};

export default function Registro() {
  useDocumentTitle('Crear cuenta');
  const { registrar, estaLogueado } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const siguiente = params.get('next');
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const form = useFormulario({ nombre: '', apellido: '', email: '', telefono: '', password: '', confirmacion: '' }, ESQUEMA);

  if (estaLogueado && !enviando) return <Navigate to={siguiente || '/'} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    if (!form.validarTodo()) return;
    setEnviando(true);
    const { confirmacion, ...datos } = form.valores;
    try {
      const sesion = await registrar({ ...datos, email: datos.email.trim(), telefono: datos.telefono.trim() || null });
      toast.exito(`¡Bienvenido/a, ${sesion.nombre.split(' ')[0]}!`, 'Tu cuenta quedó creada.');
      navegar(siguiente || '/', { replace: true });
    } catch (error) {
      if (error.status === 409) form.setErrores((prev) => ({ ...prev, email: 'Ya existe una cuenta con este email. Probá ingresar.' }));
      else setErrorGeneral(error.detalles?.length ? error.detalles.join(' · ') : error.message);
      setEnviando(false);
    }
  };

  return (
    <AuthLayout titulo="Creá tu cuenta" subtitulo="Registrate en menos de un minuto y empezá a comprar tus entradas.">
      <form className="form" onSubmit={enviar} noValidate ref={form.formRef}>
        {errorGeneral && (
          <div className="alerta alerta--error" role="alert">
            {errorGeneral}
          </div>
        )}
        <div className="form__fila">
          <Field etiqueta="Nombre" error={form.errores.nombre} requerido>
            <input className="input" autoComplete="given-name" {...form.props('nombre')} />
          </Field>
          <Field etiqueta="Apellido" error={form.errores.apellido} requerido>
            <input className="input" autoComplete="family-name" {...form.props('apellido')} />
          </Field>
        </div>
        <Field etiqueta="Email" error={form.errores.email} requerido>
          <input className="input" type="email" inputMode="email" autoComplete="email" placeholder="nombre@mail.com" {...form.props('email')} />
        </Field>
        <Field etiqueta="Teléfono" error={form.errores.telefono} ayuda="Opcional. Lo usamos solo si hay cambios en tu función.">
          <input className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="11 5555-5555" {...form.props('telefono')} />
        </Field>
        <div className="form__fila">
          <Field etiqueta="Contraseña" error={form.errores.password} ayuda="Mínimo 4 caracteres." requerido>
            <PasswordInput autoComplete="new-password" {...form.props('password')} />
          </Field>
          <Field etiqueta="Repetir contraseña" error={form.errores.confirmacion} requerido>
            <PasswordInput autoComplete="new-password" {...form.props('confirmacion')} />
          </Field>
        </div>
        <Button type="submit" tamano="lg" bloque cargando={enviando}>
          {!enviando && <UserPlus size={20} aria-hidden="true" />}
          Crear cuenta
        </Button>
        <p className="form__alternativa">
          ¿Ya tenés cuenta? <Link to={`/login${siguiente ? `?next=${encodeURIComponent(siguiente)}` : ''}`}>Ingresá</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
