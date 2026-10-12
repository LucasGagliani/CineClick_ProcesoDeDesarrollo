import { CheckCircle } from '@phosphor-icons/react';
import EntradaTicket from '../../components/cine/EntradaTicket';
import { ButtonLink } from '../../components/ui/Button';
import { METODOS_PAGO, formatearPrecio } from '../../utils/format';

export default function PasoConfirmacion({ compra, funcion }) {
  return (
    <div className="confirmacion">
      <div className="confirmacion__cabecera">
        <span className="confirmacion__icono" aria-hidden="true">
          <CheckCircle size={56} weight="fill" />
        </span>
        <h2 className="titulo-seccion">¡Listo! Tu compra está confirmada</h2>
        <p className="texto-secundario">
          Compra N° <strong>{compra.id}</strong> · {compra.entradas.length} {compra.entradas.length === 1 ? 'entrada' : 'entradas'} ·{' '}
          {formatearPrecio(compra.total)}
          {compra.pago && <> · {METODOS_PAGO[compra.pago.metodoPago]}</>}
        </p>
        {compra.pago?.codigoTransaccion && (
          <p className="texto-secundario confirmacion__transaccion">
            Transacción <code>{compra.pago.codigoTransaccion}</code>
          </p>
        )}
      </div>
      <p className="confirmacion__aviso">Mostrá estos códigos QR en el acceso a la sala. También los encontrás en “Mis compras”.</p>
      <div className="tickets">
        {compra.entradas.map((e) => (
          <EntradaTicket key={e.id} entrada={e} funcion={funcion} peliculaTitulo={compra.peliculaTitulo} />
        ))}
      </div>
      <div className="confirmacion__acciones">
        <ButtonLink to="/mis-compras" tamano="lg">
          Ver mis compras
        </ButtonLink>
        <ButtonLink to="/" variante="secondary" tamano="lg">
          Volver al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
