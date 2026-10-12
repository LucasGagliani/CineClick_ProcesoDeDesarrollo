import { CalendarBlank, Clock, MapPin } from '@phosphor-icons/react';
import Poster from '../../components/ui/Poster';
import Badge from '../../components/ui/Badge';
import { FORMATOS, TIPOS_BUTACA, formatearFechaLarga, formatearHora, formatearPrecio } from '../../utils/format';
import { precioButaca } from '../../utils/negocio';

export default function ResumenCompra({ funcion, pelicula, butacas, promo, total, children }) {
  const subtotal = butacas.reduce((suma, b) => suma + precioButaca(funcion.precioBase, b.tipo), 0);
  const descuento = total !== undefined ? subtotal - total : 0;

  return (
    <aside className="resumen" aria-label="Resumen de tu compra">
      <div className="resumen__pelicula">
        <div className="resumen__poster">
          <Poster src={pelicula?.urlPoster} titulo={funcion.peliculaTitulo} />
        </div>
        <div>
          <h2 className="resumen__titulo">{funcion.peliculaTitulo}</h2>
          <div className="resumen__badges">
            {pelicula && <Badge tono="outline">{pelicula.clasificacion}</Badge>}
            <Badge tono={funcion.formato === 'IMAX' || funcion.formato === 'CUATRO_D' ? 'gold' : 'neutral'}>{FORMATOS[funcion.formato]}</Badge>
            <Badge>{funcion.idioma}</Badge>
          </div>
        </div>
      </div>
      <ul className="resumen__datos">
        <li className="con-icono">
          <CalendarBlank size={18} aria-hidden="true" /> <span className="capitalizar">{formatearFechaLarga(funcion.fechaHoraInicio)}</span>
        </li>
        <li className="con-icono">
          <Clock size={18} aria-hidden="true" /> {formatearHora(funcion.fechaHoraInicio)} a {formatearHora(funcion.fechaHoraFin)} hs
        </li>
        <li className="con-icono">
          <MapPin size={18} aria-hidden="true" /> {funcion.cineNombre} · {funcion.salaNombre}
        </li>
      </ul>

      <div className="resumen__butacas">
        <h3>Butacas {butacas.length > 0 && `(${butacas.length})`}</h3>
        {butacas.length === 0 ? (
          <p className="texto-secundario">Todavía no elegiste butacas.</p>
        ) : (
          <ul>
            {butacas.map((b) => (
              <li key={b.id}>
                <span>
                  <strong>{b.codigo}</strong> <small className="texto-secundario">{TIPOS_BUTACA[b.tipo]}</small>
                </span>
                <span className="numero">{formatearPrecio(precioButaca(funcion.precioBase, b.tipo))}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <dl className="resumen__totales">
        {descuento > 0.009 && (
          <>
            <div>
              <dt>Subtotal</dt>
              <dd className="numero">{formatearPrecio(subtotal)}</dd>
            </div>
            <div className="resumen__descuento">
              <dt>Promo {promo?.codigo}</dt>
              <dd className="numero">−{formatearPrecio(descuento)}</dd>
            </div>
          </>
        )}
        <div className="resumen__total">
          <dt>Total</dt>
          <dd className="numero">{formatearPrecio(total ?? subtotal)}</dd>
        </div>
      </dl>

      {children}
    </aside>
  );
}
