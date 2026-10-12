import { Percent } from '@phosphor-icons/react';
import { api } from '../api';
import { useFetch } from '../hooks/useFetch';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import PromoCard from '../components/cine/PromoCard';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState, ErrorState } from '../components/ui/States';
import { promoVigente } from '../utils/negocio';

export default function Promociones() {
  useDocumentTitle('Promociones');
  const { data, loading, error, recargar } = useFetch(() => api.promociones.listar());

  if (loading && !data) return <PageLoader etiqueta="Cargando promociones…" />;

  const vigentes = (data ?? []).filter((p) => promoVigente(p));
  const proximas = (data ?? []).filter((p) => !promoVigente(p));

  return (
    <div className="contenedor seccion seccion--offset">
      <header className="pagina__cabecera">
        <p className="sobretitulo sobretitulo--dorado">Beneficios</p>
        <h1 className="titulo-pagina">Promociones</h1>
        <p className="texto-secundario">Ingresá el código en el último paso de tu compra y el descuento se aplica sobre el total.</p>
      </header>

      {error ? (
        <ErrorState error={error} onReintentar={recargar} />
      ) : vigentes.length === 0 && proximas.length === 0 ? (
        <EmptyState icono={Percent} titulo="No hay promociones activas" descripcion="Seguí atento: pronto vamos a tener nuevos beneficios." />
      ) : (
        <>
          <div className="grilla-promos">
            {vigentes.map((p) => (
              <PromoCard key={p.id} promo={p} />
            ))}
          </div>
          {proximas.length > 0 && (
            <>
              <h2 className="titulo-seccion espacio-arriba">Próximamente</h2>
              <div className="grilla-promos grilla-promos--apagada">
                {proximas.map((p) => (
                  <PromoCard key={p.id} promo={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
