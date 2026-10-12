import { query, request } from './client';

export { ApiError } from './client';

export const api = {
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  },

  peliculas: {
    listar: (genero) => request(`/peliculas${query({ genero })}`),
    obtener: (id) => request(`/peliculas/${id}`),
    crear: (dto) => request('/peliculas', { method: 'POST', body: dto }),
    actualizar: (id, dto) => request(`/peliculas/${id}`, { method: 'PUT', body: dto }),
    eliminar: (id) => request(`/peliculas/${id}`, { method: 'DELETE' }),
  },

  cines: {
    listar: (ciudad) => request(`/cines${query({ ciudad })}`),
    obtener: (id) => request(`/cines/${id}`),
    crear: (dto) => request('/cines', { method: 'POST', body: dto }),
    actualizar: (id, dto) => request(`/cines/${id}`, { method: 'PUT', body: dto }),
    eliminar: (id) => request(`/cines/${id}`, { method: 'DELETE' }),
    salas: (id) => request(`/cines/${id}/salas`),
    agregarSala: (id, dto) => request(`/cines/${id}/salas`, { method: 'POST', body: dto }),
  },

  funciones: {
    listar: (filtros = {}) => request(`/funciones${query(filtros)}`),
    obtener: (id) => request(`/funciones/${id}`),
    crear: (dto) => request('/funciones', { method: 'POST', body: dto }),
    actualizar: (id, dto) => request(`/funciones/${id}`, { method: 'PUT', body: dto }),
    eliminar: (id) => request(`/funciones/${id}`, { method: 'DELETE' }),
    butacas: (id) => request(`/funciones/${id}/butacas-disponibles`),
  },

  clientes: {
    listar: () => request('/clientes'),
    registrar: (dto) => request('/clientes', { method: 'POST', body: dto }),
    obtener: (id) => request(`/clientes/${id}`),
    actualizar: (id, dto) => request(`/clientes/${id}`, { method: 'PUT', body: dto }),
    eliminar: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),
    compras: (id) => request(`/clientes/${id}/compras`),
  },

  compras: {
    crear: (dto) => request('/compras', { method: 'POST', body: dto }),
    obtener: (id) => request(`/compras/${id}`),
    cancelar: (id, opciones = {}) => request(`/compras/${id}/cancelar`, { method: 'PATCH', ...opciones }),
  },

  pagos: {
    registrar: (compraId, dto) => request(`/compras/${compraId}/pagos`, { method: 'POST', body: dto }),
    obtener: (id) => request(`/pagos/${id}`),
  },

  promociones: {
    listar: () => request('/promociones'),
    crear: (dto) => request('/promociones', { method: 'POST', body: dto }),
  },
};
