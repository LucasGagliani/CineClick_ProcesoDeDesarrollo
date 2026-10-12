import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle, Info, WarningCircle, X } from '@phosphor-icons/react';

const ToastContext = createContext(null);
const DURACION_MS = 4500;

const ICONOS = { success: CheckCircle, error: WarningCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const siguienteId = useRef(1);

  const cerrar = useCallback((id) => setToasts((lista) => lista.filter((t) => t.id !== id)), []);

  const mostrar = useCallback(
    ({ tipo = 'info', titulo, mensaje }) => {
      const id = siguienteId.current++;
      setToasts((lista) => [...lista.slice(-3), { id, tipo, titulo, mensaje }]);
      setTimeout(() => cerrar(id), DURACION_MS);
    },
    [cerrar],
  );

  const valor = useMemo(
    () => ({
      mostrar,
      exito: (titulo, mensaje) => mostrar({ tipo: 'success', titulo, mensaje }),
      error: (titulo, mensaje) => mostrar({ tipo: 'error', titulo, mensaje }),
      info: (titulo, mensaje) => mostrar({ tipo: 'info', titulo, mensaje }),
    }),
    [mostrar],
  );

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icono = ICONOS[toast.tipo];
          return (
            <div key={toast.id} className={`toast toast--${toast.tipo}`} role="status">
              <Icono size={22} weight="fill" className="toast__icono" aria-hidden="true" />
              <div className="toast__texto">
                <strong>{toast.titulo}</strong>
                {toast.mensaje && <p>{toast.mensaje}</p>}
              </div>
              <button type="button" className="toast__cerrar" onClick={() => cerrar(toast.id)} aria-label="Cerrar aviso">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast debe usarse dentro de ToastProvider');
  return contexto;
}
