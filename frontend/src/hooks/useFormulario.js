import { useCallback, useRef, useState } from 'react';
import { enfocarPrimerError, validar } from '../utils/validacion';

export function useFormulario(inicial, esquema) {
  const [valores, setValores] = useState(inicial);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const formRef = useRef(null);

  const cambiar = useCallback(
    (evento) => {
      const { name, value, type, checked } = evento.target;
      const valor = type === 'checkbox' ? checked : value;
      setValores((previo) => {
        const nuevos = { ...previo, [name]: valor };
        if (tocados[name]) setErrores((e) => ({ ...e, [name]: validar(nuevos, { [name]: esquema[name] ?? [] })[name] }));
        return nuevos;
      });
    },
    [esquema, tocados],
  );

  const asignar = useCallback((campo, valor) => setValores((previo) => ({ ...previo, [campo]: valor })), []);

  const desenfocar = useCallback(
    (evento) => {
      const { name } = evento.target;
      setTocados((t) => ({ ...t, [name]: true }));
      setErrores((e) => ({ ...e, [name]: validar(valores, { [name]: esquema[name] ?? [] })[name] }));
    },
    [esquema, valores],
  );

  const validarTodo = useCallback(() => {
    const encontrados = validar(valores, esquema);
    setErrores(encontrados);
    setTocados(Object.fromEntries(Object.keys(esquema).map((k) => [k, true])));
    enfocarPrimerError(formRef.current, encontrados);
    return Object.keys(encontrados).length === 0;
  }, [esquema, valores]);

  const reiniciar = useCallback((nuevos = inicial) => {
    setValores(nuevos);
    setErrores({});
    setTocados({});
  }, [inicial]);

  const props = (campo) => ({ name: campo, value: valores[campo] ?? '', onChange: cambiar, onBlur: desenfocar });

  return { valores, errores, setErrores, cambiar, asignar, props, validarTodo, reiniciar, formRef };
}
