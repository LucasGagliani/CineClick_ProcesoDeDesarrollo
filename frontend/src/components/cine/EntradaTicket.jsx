import { QRCodeSVG } from 'qrcode.react';
import { EstadoBadge } from '../ui/Badge';
import { ESTADOS_ENTRADA, FORMATOS, formatearFechaLarga, formatearHora, formatearPrecio } from '../../utils/format';

export default function EntradaTicket({ entrada, funcion, peliculaTitulo }) {
  const valida = entrada.estado === 'EMITIDA';
  return (
    <article className={`ticket ${valida ? '' : 'ticket--invalida'}`} aria-label={`Entrada butaca ${entrada.codigoButaca}`}>
      <div className="ticket__cuerpo">
        <p className="ticket__sobretitulo">CineClick · Entrada</p>
        <h3 className="ticket__titulo">{peliculaTitulo}</h3>
        {funcion && (
          <dl className="ticket__datos">
            <div>
              <dt>Fecha</dt>
              <dd>{formatearFechaLarga(funcion.fechaHoraInicio)}</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>{formatearHora(funcion.fechaHoraInicio)}</dd>
            </div>
            <div>
              <dt>Cine</dt>
              <dd>{funcion.cineNombre}</dd>
            </div>
            <div>
              <dt>Sala</dt>
              <dd>
                {funcion.salaNombre}
                {!funcion.salaNombre.toUpperCase().includes(FORMATOS[funcion.formato]) && ` · ${FORMATOS[funcion.formato]}`}
              </dd>
            </div>
          </dl>
        )}
        <div className="ticket__pie">
          <div className="ticket__butaca">
            <span>Butaca</span>
            <strong>{entrada.codigoButaca}</strong>
          </div>
          <div className="ticket__precio">
            <span>Precio</span>
            <strong>{formatearPrecio(entrada.precioUnitario)}</strong>
          </div>
          <EstadoBadge estado={entrada.estado} mapa={ESTADOS_ENTRADA} />
        </div>
      </div>
      <div className="ticket__talon">
        <div className="ticket__qr">
          <QRCodeSVG value={entrada.codigoQr} size={112} bgColor="#ffffff" fgColor="#0b0b10" level="M" title={`Código QR de la entrada ${entrada.codigoButaca}`} />
        </div>
        <code className="ticket__codigo">{entrada.codigoQr.replace('CINECLICK-', '').slice(0, 8).toUpperCase()}</code>
      </div>
    </article>
  );
}
