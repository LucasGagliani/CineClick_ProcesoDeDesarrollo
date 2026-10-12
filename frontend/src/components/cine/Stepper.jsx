import { Check } from '@phosphor-icons/react';

export default function Stepper({ pasos, actual }) {
  return (
    <ol className="stepper" aria-label="Pasos de la compra">
      {pasos.map((paso, i) => {
        const estado = i < actual ? 'hecho' : i === actual ? 'actual' : 'pendiente';
        return (
          <li key={paso} className={`stepper__paso stepper__paso--${estado}`} aria-current={estado === 'actual' ? 'step' : undefined}>
            <span className="stepper__numero" aria-hidden="true">
              {estado === 'hecho' ? <Check size={14} weight="bold" /> : i + 1}
            </span>
            <span className="stepper__texto">
              {paso}
              {estado === 'hecho' && <span className="sr-only"> (completado)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
