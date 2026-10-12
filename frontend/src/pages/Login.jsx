import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { SignIn } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useFormulario } from '../hooks/useFormulario';
import Field, { PasswordInput } from '../components/ui/Field';
import Button from '../components/ui/Button';
import AuthLayout from '../components/layout/AuthLayout';
import { reglas } from '../utils/validacion';

const ESQUEMA = {
  email: [reglas.requerido('Ingresá tu email.'), reglas.email()],
  password: [reglas.requerido('Ingresá tu contraseña.')],
};

export default function Login() {
  useDocumentTitle('Ingresar');
  const { login, estaLogueado, esAdmin } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const siguiente = params.get('next');
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const form = useFormulario({ email: '', password: '' }, ESQUEMA);

  if (estaLogueado && !enviando) return <Navigate to={siguiente || (esAdmin ? '/admin' : '/')} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setErrorGeneral('');
    if (!form.validarTodo()) return;
    setEnviando(true);
    try {
      const sesion = await login(form.valores.email.trim(), form.valores.password);
      toast.exito(`¡Hola, ${sesion.nombre.split(' ')[0]}!`, 'Ingresaste correctamente.');
      navegar(siguiente || (sesion.rol === 'ADMIN' ? '/admin' : '/'), { replace: true });
    } catch (error) {
      setErrorGeneral(error.status === 401 ? 'El email o la contraseña no son correctos. Revisalos e intentá de nuevo.' : error.message);
      setEnviando(false);
    }
  };

  return (
    <AuthLayout titulo="Ingresá a tu cuenta" subtitulo="Comprá entradas, elegí tu butaca y llevá tus tickets en el celular.">
      <form className="form" onSubmit={enviar} noValidate ref={form.formRef}>
        {errorGeneral && (
          <div className="alerta alerta--error" role="alert">
            {errorGeneral}
          </div>
        )}
        <Field etiqueta="Email" error={form.errores.email} requerido>
          <input className="input" type="email" autoComplete="email" inputMode="email" placeholder="nombre@mail.com" {...form.props('email')} />
        </Field>
        <Field etiqueta="Contraseña" error={form.errores.password} requerido>
          <PasswordInput autoComplete="current-password" {...form.props('password')} />
        </Field>
        <Button type="submit" tamano="lg" bloque cargando={enviando}>
          {!enviando && <SignIn size={20} aria-hidden="true" />}
          Ingresar
        </Button>
        <p className="form__alternativa">
          ¿Todavía no tenés cuenta?{' '}
          <Link to={`/registro${siguiente ? `?next=${encodeURIComponent(siguiente)}` : ''}`}>Registrate gratis</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
