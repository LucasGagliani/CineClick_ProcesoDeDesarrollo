import { api } from './index';

export async function cargarComprasDeTodos() {
  const clientes = await api.clientes.listar();
  const listas = await Promise.all(
    clientes.map((cliente) =>
      api.clientes
        .compras(cliente.id)
        .then((compras) => compras.map((compra) => ({ ...compra, cliente })))
        .catch(() => []),
    ),
  );
  return { clientes, compras: listas.flat() };
}

export async function cargarOcupacion(funciones) {
  const resultados = await Promise.all(
    funciones.map((f) =>
      api.funciones
        .butacas(f.id)
        .then((butacas) => ({ funcionId: f.id, total: butacas.length, vendidas: butacas.filter((b) => !b.disponible).length }))
        .catch(() => ({ funcionId: f.id, total: 0, vendidas: 0 })),
    ),
  );
  return new Map(resultados.map((r) => [r.funcionId, r]));
}
