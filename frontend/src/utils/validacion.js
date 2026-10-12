const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const reglas = {
  requerido: (mensaje = 'Este campo es obligatorio.') => (v) => (v === undefined || v === null || String(v).trim() === '' ? mensaje : null),
  email: () => (v) => (v && !EMAIL.test(v) ? 'Ingresá un email válido, por ejemplo nombre@mail.com.' : null),
  max: (n) => (v) => (v && String(v).length > n ? `Máximo ${n} caracteres.` : null),
  min: (n) => (v) => (v && String(v).length < n ? `Mínimo ${n} caracteres.` : null),
  numeroMin: (n, mensaje) => (v) => (v !== '' && v !== null && v !== undefined && Number(v) < n ? mensaje ?? `Debe ser mayor o igual a ${n}.` : null),
  numeroMax: (n, mensaje) => (v) => (v !== '' && v !== null && v !== undefined && Number(v) > n ? mensaje ?? `Debe ser menor o igual a ${n}.` : null),
};

export function validar(valores, esquema) {
  const errores = {};
  Object.entries(esquema).forEach(([campo, validadores]) => {
    for (const validador of validadores) {
      const error = validador(valores[campo], valores);
      if (error) {
        errores[campo] = error;
        break;
      }
    }
  });
  return errores;
}

export function enfocarPrimerError(formulario, errores) {
  const primero = Object.keys(errores)[0];
  if (!primero || !formulario) return;
  formulario.querySelector(`[name="${primero}"]`)?.focus();
}
