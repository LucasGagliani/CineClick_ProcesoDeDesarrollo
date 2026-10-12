import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api';

const CLAVE_SESION = 'cineclick.sesion';
const AuthContext = createContext(null);

function leerSesion() {
  try {
    const guardada = localStorage.getItem(CLAVE_SESION);
    return guardada ? JSON.parse(guardada) : null;
  } catch {
    return null;
  }
}

function persistir(sesion) {
  try {
    if (sesion) localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    else localStorage.removeItem(CLAVE_SESION);
  } catch {
    return;
  }
}

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(leerSesion);

  const guardar = useCallback((nueva) => {
    setSesion(nueva);
    persistir(nueva);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const respuesta = await api.auth.login(email, password);
      let clienteId = null;
      if (respuesta.rol === 'CLIENTE') {
        const clientes = await api.clientes.listar();
        clienteId = clientes.find((c) => c.usuarioId === respuesta.usuarioId)?.id ?? null;
      }
      const nueva = {
        usuarioId: respuesta.usuarioId,
        clienteId,
        nombre: respuesta.nombreCompleto,
        email: respuesta.email,
        rol: respuesta.rol,
      };
      guardar(nueva);
      return nueva;
    },
    [guardar],
  );

  const registrar = useCallback(
    async (datos) => {
      await api.clientes.registrar(datos);
      return login(datos.email, datos.password);
    },
    [login],
  );

  const logout = useCallback(() => guardar(null), [guardar]);

  const actualizarSesion = useCallback(
    (parcial) => setSesion((actual) => {
      const nueva = { ...actual, ...parcial };
      persistir(nueva);
      return nueva;
    }),
    [],
  );

  const valor = useMemo(
    () => ({
      sesion,
      estaLogueado: Boolean(sesion),
      esAdmin: sesion?.rol === 'ADMIN',
      login,
      registrar,
      logout,
      actualizarSesion,
    }),
    [sesion, login, registrar, logout, actualizarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return contexto;
}
