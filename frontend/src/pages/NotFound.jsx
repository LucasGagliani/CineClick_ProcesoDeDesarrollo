import { FilmSlate } from '@phosphor-icons/react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ButtonLink } from '../components/ui/Button';

export default function NotFound() {
  useDocumentTitle('Página no encontrada');
  return (
    <div className="contenedor seccion seccion--offset no-encontrado">
      <FilmSlate size={64} aria-hidden="true" />
      <p className="no-encontrado__codigo">404</p>
      <h1 className="titulo-pagina">Esta escena no existe</h1>
      <p className="texto-secundario">La página que buscás se quedó en la sala de edición.</p>
      <ButtonLink to="/" tamano="lg">
        Volver a la cartelera
      </ButtonLink>
    </div>
  );
}
