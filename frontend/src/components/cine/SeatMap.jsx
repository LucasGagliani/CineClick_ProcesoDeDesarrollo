import { useMemo } from 'react';
import { Wheelchair, X } from '@phosphor-icons/react';
import { TIPOS_BUTACA, formatearPrecio } from '../../utils/format';
import { precioButaca } from '../../utils/negocio';

function Leyenda({ precioBase }) {
  return (
    <ul className="sala__leyenda" aria-label="Referencias del mapa de butacas">
      <li>
        <span className="butaca butaca--muestra" aria-hidden="true" /> Disponible · {formatearPrecio(precioBase)}
      </li>
      <li>
        <span className="butaca butaca--muestra butaca--vip" aria-hidden="true" /> VIP · {formatearPrecio(precioButaca(precioBase, 'VIP'))}
      </li>
      <li>
        <span className="butaca butaca--muestra butaca--accesible" aria-hidden="true">
          <Wheelchair size={12} weight="bold" />
        </span>
        Accesible · {formatearPrecio(precioButaca(precioBase, 'DISCAPACIDAD'))}
      </li>
      <li>
        <span className="butaca butaca--muestra butaca--seleccionada" aria-hidden="true" /> Tu selección
      </li>
      <li>
        <span className="butaca butaca--muestra butaca--ocupada" aria-hidden="true">
          <X size={12} weight="bold" />
        </span>
        Ocupada
      </li>
    </ul>
  );
}

export default function SeatMap({ butacas, seleccionadas, onAlternar, precioBase, deshabilitado }) {
  const { filas, columnas } = useMemo(() => {
    const mapa = new Map();
    let maximo = 0;
    [...butacas]
      .sort((a, b) => a.fila.localeCompare(b.fila) || a.numero - b.numero)
      .forEach((b) => {
        if (!mapa.has(b.fila)) mapa.set(b.fila, new Map());
        mapa.get(b.fila).set(b.numero, b);
        maximo = Math.max(maximo, b.numero);
      });
    return { filas: [...mapa], columnas: maximo };
  }, [butacas]);

  return (
    <div className="sala">
      <div className="sala__pantalla" aria-hidden="true">
        <span>Pantalla</span>
      </div>
      <div className="sala__scroll">
        <div className="sala__grid" role="group" aria-label="Mapa de butacas">
          {filas.map(([fila, asientos]) => (
            <div className="sala__fila" key={fila}>
              <span className="sala__letra" aria-hidden="true">
                {fila}
              </span>
              <div className="sala__butacas">
                {Array.from({ length: columnas }, (_, i) => {
                  const butaca = asientos.get(i + 1);
                  if (!butaca) return <span key={i} className="butaca butaca--vacia" aria-hidden="true" />;
                  const seleccionada = seleccionadas.has(butaca.id);
                  const precio = precioButaca(precioBase, butaca.tipo);
                  const estado = !butaca.disponible ? 'ocupada' : seleccionada ? 'seleccionada' : 'disponible';
                  const clases = [
                    'butaca',
                    butaca.tipo === 'VIP' && 'butaca--vip',
                    butaca.tipo === 'DISCAPACIDAD' && 'butaca--accesible',
                    !butaca.disponible && 'butaca--ocupada',
                    seleccionada && 'butaca--seleccionada',
                  ]
                    .filter(Boolean)
                    .join(' ');
                  return (
                    <button
                      key={butaca.id}
                      type="button"
                      className={clases}
                      disabled={!butaca.disponible || deshabilitado}
                      aria-pressed={seleccionada}
                      aria-label={`Butaca ${butaca.codigo}, ${TIPOS_BUTACA[butaca.tipo]}, ${formatearPrecio(precio)}, ${estado}`}
                      title={`${butaca.codigo} · ${TIPOS_BUTACA[butaca.tipo]} · ${formatearPrecio(precio)}`}
                      onClick={() => onAlternar(butaca)}
                    >
                      {!butaca.disponible ? (
                        <X size={12} weight="bold" aria-hidden="true" />
                      ) : butaca.tipo === 'DISCAPACIDAD' ? (
                        <Wheelchair size={13} weight="bold" aria-hidden="true" />
                      ) : (
                        <span aria-hidden="true">{butaca.numero}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="sala__letra" aria-hidden="true">
                {fila}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Leyenda precioBase={precioBase} />
    </div>
  );
}
