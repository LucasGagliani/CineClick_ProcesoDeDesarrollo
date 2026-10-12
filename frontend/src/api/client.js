const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, mensaje, detalles = []) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }
}

function mensajePorEstado(status) {
  if (status === 404) return 'No encontramos lo que buscabas.';
  if (status === 401) return 'Email o contraseña incorrectos.';
  if (status === 409) return 'El recurso ya existe o está en uso.';
  if (status >= 500) return 'El servidor no está respondiendo. Revisá que el backend esté levantado en el puerto 8080.';
  return 'Ocurrió un error inesperado.';
}

function parsear(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export async function request(path, { method = 'GET', body, signal, keepalive } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      keepalive,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'No pudimos conectarnos con el servidor. Revisá que el backend esté levantado.');
  }

  if (respuesta.status === 204) return null;

  const texto = await respuesta.text();
  const datos = texto ? parsear(texto) : null;

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, datos?.mensaje || mensajePorEstado(respuesta.status), datos?.detalles || []);
  }
  return datos;
}

export function query(params) {
  const entradas = Object.entries(params).filter(([, valor]) => valor !== undefined && valor !== null && valor !== '');
  if (entradas.length === 0) return '';
  return `?${new URLSearchParams(entradas).toString()}`;
}
