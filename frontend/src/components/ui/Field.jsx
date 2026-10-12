import { cloneElement, isValidElement, useId, useState } from 'react';
import { Eye, EyeSlash } from '@phosphor-icons/react';

export default function Field({ etiqueta, error, ayuda, requerido, children, className = '' }) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const describedBy = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        required: requerido || children.props.required,
      })
    : children;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`.trim()}>
      <label className="field__label" htmlFor={children?.props?.id ?? id}>
        {etiqueta}
        {requerido && (
          <span className="field__requerido" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {control}
      {ayuda && !error && (
        <p className="field__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      )}
      {error && (
        <p className="field__error" id={idError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-con-accion">
      <input {...props} type={visible ? 'text' : 'password'} className="input" />
      <button
        type="button"
        className="input-con-accion__boton"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {visible ? <EyeSlash size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}
