import { useEffect } from 'react';

export function useDocumentTitle(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} | CineClick` : 'CineClick | Entradas de cine';
  }, [titulo]);
}
