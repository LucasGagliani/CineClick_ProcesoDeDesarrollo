import { useEffect, useState } from 'react';

export function useCountdown(finaliza) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    if (!finaliza) return undefined;
    setAhora(Date.now());
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [finaliza]);

  const restante = finaliza ? Math.max(0, finaliza - ahora) : 0;
  const minutos = Math.floor(restante / 60000);
  const segundos = Math.floor((restante % 60000) / 1000);
  return { restante, texto: `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}` };
}
