const moneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatearPrecio = (valor) => moneda.format(Number(valor ?? 0));

export function parsearFecha(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  return new Date(valor);
}

const dos = (n) => String(n).padStart(2, '0');

export function claveDia(valor) {
  const fecha = parsearFecha(valor);
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`;
}

export function aLocalDateTime(fecha) {
  return `${claveDia(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`;
}

export function aInputDateTime(valor) {
  const fecha = parsearFecha(valor);
  if (!fecha) return '';
  return `${claveDia(fecha)}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

export const formatearHora = (valor) =>
  parsearFecha(valor).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });

export const formatearFechaCorta = (valor) =>
  parsearFecha(valor).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

export const formatearFechaLarga = (valor) =>
  parsearFecha(valor).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

export const formatearFecha = (valor) =>
  parsearFecha(valor).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export const formatearFechaHora = (valor) => `${formatearFechaCorta(valor)} · ${formatearHora(valor)}`;

export function etiquetaDia(valor) {
  const clave = claveDia(valor);
  const hoy = new Date();
  const manana = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
  if (clave === claveDia(hoy)) return 'Hoy';
  if (clave === claveDia(manana)) return 'Mañana';
  return formatearFechaCorta(valor);
}

export function formatearDuracion(minutos) {
  if (!minutos) return '';
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas === 0) return `${resto} min`;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export const FORMATOS = { DOS_D: '2D', TRES_D: '3D', IMAX: 'IMAX', CUATRO_D: '4D' };

export const GENEROS = {
  ACCION: 'Acción',
  COMEDIA: 'Comedia',
  DRAMA: 'Drama',
  TERROR: 'Terror',
  CIENCIA_FICCION: 'Ciencia ficción',
  ANIMACION: 'Animación',
  DOCUMENTAL: 'Documental',
};

export const TIPOS_SALA = { TRADICIONAL: 'Tradicional', PREMIUM: 'Premium', IMAX: 'IMAX', CUATRO_D: '4D' };

export const TIPOS_BUTACA = { NORMAL: 'Normal', VIP: 'VIP', DISCAPACIDAD: 'Accesible' };

export const METODOS_PAGO = {
  TARJETA_CREDITO: 'Tarjeta de crédito',
  TARJETA_DEBITO: 'Tarjeta de débito',
  MERCADO_PAGO: 'Mercado Pago',
  EFECTIVO: 'Efectivo en boletería',
};

export const ESTADOS_COMPRA = {
  PENDIENTE_PAGO: { texto: 'Pendiente de pago', tono: 'warning' },
  CONFIRMADA: { texto: 'Confirmada', tono: 'success' },
  CANCELADA: { texto: 'Cancelada', tono: 'neutral' },
};

export const ESTADOS_PAGO = {
  PENDIENTE: { texto: 'Pendiente', tono: 'warning' },
  APROBADO: { texto: 'Aprobado', tono: 'success' },
  RECHAZADO: { texto: 'Rechazado', tono: 'danger' },
};

export const ESTADOS_FUNCION = {
  PROGRAMADA: { texto: 'Programada', tono: 'success' },
  AGOTADA: { texto: 'Agotada', tono: 'warning' },
  CANCELADA: { texto: 'Cancelada', tono: 'danger' },
  FINALIZADA: { texto: 'Finalizada', tono: 'neutral' },
};

export const ESTADOS_ENTRADA = {
  EMITIDA: { texto: 'Válida', tono: 'success' },
  USADA: { texto: 'Usada', tono: 'neutral' },
  CANCELADA: { texto: 'Cancelada', tono: 'danger' },
};

export const opciones = (mapa) => Object.entries(mapa).map(([valor, etiqueta]) => ({ valor, etiqueta }));
