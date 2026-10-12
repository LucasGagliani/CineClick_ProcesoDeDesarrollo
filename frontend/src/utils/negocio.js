import { claveDia, parsearFecha } from './format';

export const RECARGO_BUTACA = { NORMAL: 1, VIP: 1.3, DISCAPACIDAD: 0.8 };

export const MAX_BUTACAS_POR_COMPRA = 10;

export const MINUTOS_PARA_PAGAR = 10;

const redondear = (valor) => Math.round(valor * 100) / 100;

export const precioButaca = (precioBase, tipo) => redondear(Number(precioBase) * (RECARGO_BUTACA[tipo] ?? 1));

export const aplicarDescuento = (total, porcentaje) => redondear(total * (1 - Number(porcentaje) / 100));

export function promoVigente(promo, hoy = new Date()) {
  if (!promo?.activa) return false;
  const dia = claveDia(hoy);
  return claveDia(promo.fechaInicio) <= dia && dia <= claveDia(promo.fechaFin);
}

export function funcionVendible(funcion, ahora = new Date()) {
  return funcion.estado === 'PROGRAMADA' && parsearFecha(funcion.fechaHoraInicio) > ahora;
}

export function ordenarPorInicio(funciones) {
  return [...funciones].sort((a, b) => parsearFecha(a.fechaHoraInicio) - parsearFecha(b.fechaHoraInicio));
}

export function agruparPor(lista, clave) {
  return lista.reduce((mapa, item) => {
    const k = typeof clave === 'function' ? clave(item) : item[clave];
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k).push(item);
    return mapa;
  }, new Map());
}

export function diasDisponibles(funciones) {
  return [...new Set(ordenarPorInicio(funciones).map((f) => claveDia(f.fechaHoraInicio)))];
}
