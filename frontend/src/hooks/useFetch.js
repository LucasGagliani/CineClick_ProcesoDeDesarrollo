import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetch(cargar, dependencias = []) {
  const [estado, setEstado] = useState({ data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  useEffect(() => {
    let activo = true;
    setEstado((previo) => ({ ...previo, loading: true, error: null }));
    cargarRef
      .current()
      .then((data) => activo && setEstado({ data, loading: false, error: null }))
      .catch((error) => activo && setEstado({ data: null, loading: false, error }));
    return () => {
      activo = false;
    };
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (valor) => setEstado((previo) => ({ ...previo, data: typeof valor === 'function' ? valor(previo.data) : valor })),
    [],
  );

  return { ...estado, recargar, setData };
}
