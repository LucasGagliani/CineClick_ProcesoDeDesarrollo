import { useState } from 'react';
import { CreditCard, Info, Money, Timer, Wallet } from '@phosphor-icons/react';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useFormulario } from '../../hooks/useFormulario';
import { formatearPrecio } from '../../utils/format';
import { reglas } from '../../utils/validacion';

const TARJETA_RECHAZO = '4000000000000002';

const METODOS = [
  { valor: 'TARJETA_CREDITO', titulo: 'Tarjeta de crédito', detalle: 'Visa, Mastercard, Amex', icono: CreditCard },
  { valor: 'TARJETA_DEBITO', titulo: 'Tarjeta de débito', detalle: 'Débito inmediato', icono: CreditCard },
  { valor: 'MERCADO_PAGO', titulo: 'Mercado Pago', detalle: 'Dinero en cuenta', icono: Wallet },
  { valor: 'EFECTIVO', titulo: 'Efectivo', detalle: 'Pagás en boletería', icono: Money },
];

const soloDigitos = (v) => v.replace(/\D/g, '');

function vencimientoValido(v) {
  const m = /^(\d{2})\/(\d{2})$/.exec(v || '');
  if (!m) return 'Usá el formato MM/AA.';
  const mes = Number(m[1]);
  const anio = 2000 + Number(m[2]);
  if (mes < 1 || mes > 12) return 'El mes no es válido.';
  const hoy = new Date();
  if (anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1)) return 'La tarjeta está vencida.';
  return null;
}

const ESQUEMA_TARJETA = {
  numero: [reglas.requerido('Ingresá el número de la tarjeta.'), (v) => (soloDigitos(v).length < 15 ? 'El número debe tener 15 o 16 dígitos.' : null)],
  titular: [reglas.requerido('Ingresá el nombre como figura en la tarjeta.'), reglas.max(60)],
  vencimiento: [reglas.requerido('Ingresá el vencimiento.'), vencimientoValido],
  cvv: [reglas.requerido('Ingresá el código de seguridad.'), (v) => (!/^\d{3,4}$/.test(v) ? 'Son 3 o 4 dígitos.' : null)],
};

export default function PasoPago({ total, tiempoRestante, onPagar, onCancelar, procesando }) {
  const [metodo, setMetodo] = useState('TARJETA_CREDITO');
  const tarjeta = useFormulario({ numero: '', titular: '', vencimiento: '', cvv: '' }, ESQUEMA_TARJETA);
  const usaTarjeta = metodo.startsWith('TARJETA');

  const cambiarNumero = (e) => {
    const digitos = soloDigitos(e.target.value).slice(0, 16);
    tarjeta.asignar('numero', digitos.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const cambiarVencimiento = (e) => {
    const digitos = soloDigitos(e.target.value).slice(0, 4);
    tarjeta.asignar('vencimiento', digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos);
  };

  const enviar = (e) => {
    e.preventDefault();
    if (usaTarjeta && !tarjeta.validarTodo()) return;
    const numero = soloDigitos(tarjeta.valores.numero);
    const token = usaTarjeta ? (numero === TARJETA_RECHAZO ? 'rechazar' : `tok_${numero.slice(-4)}`) : `tok_${metodo.toLowerCase()}`;
    onPagar({ metodoPago: metodo, datosPagoToken: token });
  };

  return (
    <form className="panel" onSubmit={enviar} noValidate ref={tarjeta.formRef}>
      <div className={`cuenta-regresiva ${tiempoRestante.restante < 120000 ? 'cuenta-regresiva--urgente' : ''}`} role="timer" aria-live="off">
        <Timer size={22} aria-hidden="true" />
        <span>
          Reservamos tus butacas por <strong className="numero">{tiempoRestante.texto}</strong> minutos.
        </span>
      </div>

      <fieldset className="metodos-pago">
        <legend className="panel__titulo">Medio de pago</legend>
        <div className="metodos-pago__grilla">
          {METODOS.map(({ valor, titulo, detalle, icono: Icono }) => (
            <label key={valor} className={`metodo ${metodo === valor ? 'metodo--activo' : ''}`}>
              <input type="radio" name="metodo" value={valor} checked={metodo === valor} onChange={() => setMetodo(valor)} />
              <Icono size={26} aria-hidden="true" />
              <span>
                <strong>{titulo}</strong>
                <small>{detalle}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {usaTarjeta ? (
        <div className="form tarjeta-form">
          <Field etiqueta="Número de tarjeta" error={tarjeta.errores.numero} requerido ayuda="Simulación: usá 4000 0000 0000 0002 para probar un pago rechazado.">
            <input
              className="input numero"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              {...tarjeta.props('numero')}
              onChange={cambiarNumero}
            />
          </Field>
          <Field etiqueta="Nombre del titular" error={tarjeta.errores.titular} requerido>
            <input className="input" autoComplete="cc-name" placeholder="Como figura en la tarjeta" {...tarjeta.props('titular')} />
          </Field>
          <div className="form__fila">
            <Field etiqueta="Vencimiento" error={tarjeta.errores.vencimiento} requerido>
              <input className="input numero" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" {...tarjeta.props('vencimiento')} onChange={cambiarVencimiento} />
            </Field>
            <Field etiqueta="Código de seguridad" error={tarjeta.errores.cvv} requerido>
              <input className="input numero" inputMode="numeric" autoComplete="cc-csc" placeholder="CVV" maxLength={4} {...tarjeta.props('cvv')} />
            </Field>
          </div>
        </div>
      ) : (
        <div className="alerta alerta--info">
          <Info size={20} aria-hidden="true" />
          {metodo === 'MERCADO_PAGO'
            ? 'Vas a confirmar el pago con el saldo de tu cuenta de Mercado Pago.'
            : 'Tu reserva queda confirmada y abonás el total en la boletería del cine antes de la función.'}
        </div>
      )}

      <div className="panel__acciones">
        <Button variante="ghost" onClick={onCancelar} disabled={procesando}>
          Cancelar compra
        </Button>
        <Button type="submit" tamano="lg" cargando={procesando}>
          {procesando ? 'Procesando pago…' : `Pagar ${formatearPrecio(total)}`}
        </Button>
      </div>
    </form>
  );
}
