import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Info, Tag, WarningCircle, X } from '@phosphor-icons/react';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { useCountdown } from '../../hooks/useCountdown';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import SeatMap from '../../components/cine/SeatMap';
import Stepper from '../../components/cine/Stepper';
import Button, { ButtonLink } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/States';
import ResumenCompra from './ResumenCompra';
import PasoPago from './PasoPago';
import PasoConfirmacion from './PasoConfirmacion';
import { TIPOS_BUTACA, formatearPrecio } from '../../utils/format';
import { MAX_BUTACAS_POR_COMPRA, MINUTOS_PARA_PAGAR, aplicarDescuento, funcionVendible, precioButaca, promoVigente } from '../../utils/negocio';

const PASOS = ['Butacas', 'Resumen', 'Pago', 'Confirmación'];

export default function Compra() {
  const { funcionId } = useParams();
  const [params, setParams] = useSearchParams();
  const { sesion } = useAuth();
  const toast = useToast();
  const navegar = useNavigate();

  const { data, loading, error, recargar, setData } = useFetch(async () => {
    const funcion = await api.funciones.obtener(funcionId);
    const [pelicula, butacas, promociones] = await Promise.all([
      api.peliculas.obtener(funcion.peliculaId).catch(() => null),
      api.funciones.butacas(funcionId),
      api.promociones.listar().catch(() => []),
    ]);
    return { funcion, pelicula, butacas, promociones };
  }, [funcionId]);

  const [paso, setPaso] = useState(0);
  const [seleccion, setSeleccion] = useState(() => new Map());
  const [codigo, setCodigo] = useState('');
  const [promo, setPromo] = useState(null);
  const [errorPromo, setErrorPromo] = useState('');
  const [compra, setCompra] = useState(null);
  const [venceEn, setVenceEn] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [pagoRechazado, setPagoRechazado] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const pendiente = useRef(null);
  const reanudada = useRef(false);
  const expirando = useRef(false);

  useDocumentTitle(data ? `Entradas para ${data.funcion.peliculaTitulo}` : 'Comprar entradas');
  const tiempo = useCountdown(venceEn);

  const butacasSeleccionadas = useMemo(
    () => [...seleccion.values()].sort((a, b) => a.fila.localeCompare(b.fila) || a.numero - b.numero),
    [seleccion],
  );

  const subtotal = data ? butacasSeleccionadas.reduce((s, b) => s + precioButaca(data.funcion.precioBase, b.tipo), 0) : 0;
  const totalEstimado = promo ? aplicarDescuento(subtotal, promo.porcentajeDescuento) : subtotal;

  const liberar = useCallback(async (id, silencioso = false) => {
    if (!id) return;
    try {
      await api.compras.cancelar(id, silencioso ? { keepalive: true } : {});
    } catch {
      return;
    } finally {
      if (pendiente.current === id) pendiente.current = null;
    }
  }, []);

  useEffect(() => {
    const alSalir = () => {
      if (pendiente.current) api.compras.cancelar(pendiente.current, { keepalive: true }).catch(() => {});
    };
    window.addEventListener('pagehide', alSalir);
    return () => {
      window.removeEventListener('pagehide', alSalir);
      alSalir();
    };
  }, []);

  const recargarButacas = useCallback(async () => {
    try {
      const butacas = await api.funciones.butacas(funcionId);
      setData((previo) => ({ ...previo, butacas }));
    } catch {
      recargar();
    }
  }, [funcionId, recargar, setData]);

  const volverAButacas = useCallback(
    async (mensaje) => {
      setCompra(null);
      setVenceEn(null);
      setPagoRechazado(false);
      setSeleccion(new Map());
      setPaso(0);
      setParams({}, { replace: true });
      await recargarButacas();
      if (mensaje) toast.info(mensaje.titulo, mensaje.texto);
    },
    [recargarButacas, setParams, toast],
  );

  useEffect(() => {
    const idCompra = params.get('compra');
    if (!data || !idCompra || reanudada.current) return;
    reanudada.current = true;
    api.compras
      .obtener(idCompra)
      .then((c) => {
        if (c.clienteId !== sesion.clienteId || c.estado !== 'PENDIENTE_PAGO' || String(c.funcionId) !== String(funcionId)) {
          setParams({}, { replace: true });
          return;
        }
        const porCodigo = new Map(data.butacas.map((b) => [b.codigo, b]));
        setSeleccion(new Map(c.entradas.map((e) => porCodigo.get(e.codigoButaca)).filter(Boolean).map((b) => [b.id, b])));
        setCompra(c);
        if (c.pago?.estado === 'RECHAZADO') setPagoRechazado(true);
        pendiente.current = c.id;
        setVenceEn(Date.now() + MINUTOS_PARA_PAGAR * 60000);
        setPaso(2);
      })
      .catch(() => setParams({}, { replace: true }));
  }, [data, params, sesion, funcionId, setParams]);

  useEffect(() => {
    if (paso !== 2 || !venceEn || tiempo.restante > 0 || !compra || expirando.current) return;
    expirando.current = true;
    liberar(compra.id)
      .then(() => volverAButacas({ titulo: 'Se agotó el tiempo de reserva', texto: 'Liberamos tus butacas. Podés elegirlas de nuevo.' }))
      .finally(() => {
        expirando.current = false;
      });
  }, [paso, venceEn, tiempo.restante, compra, liberar, volverAButacas]);

  if (loading && !data) return <PageLoader etiqueta="Preparando la sala…" />;
  if (error) {
    return (
      <div className="contenedor seccion seccion--offset">
        <ErrorState error={error} onReintentar={error.status === 404 ? undefined : recargar} titulo={error.status === 404 ? 'La función no existe' : undefined} />
      </div>
    );
  }

  const { funcion, pelicula, butacas, promociones } = data;

  if (!sesion.clienteId) {
    return (
      <div className="contenedor seccion seccion--offset">
        <EmptyState icono={Info} titulo="Esta cuenta no puede comprar entradas" descripcion="Las cuentas de administrador gestionan el sitio. Para comprar, ingresá con una cuenta de cliente.">
          <ButtonLink to="/admin">Ir al panel</ButtonLink>
        </EmptyState>
      </div>
    );
  }

  if (!funcionVendible(funcion) && paso < 3) {
    return (
      <div className="contenedor seccion seccion--offset">
        <EmptyState icono={WarningCircle} titulo="Esta función ya no está a la venta" descripcion="Puede que haya comenzado o que haya sido cancelada. Elegí otro horario.">
          <ButtonLink to={`/peliculas/${funcion.peliculaId}`}>Ver otros horarios</ButtonLink>
        </EmptyState>
      </div>
    );
  }

  const disponibles = butacas.filter((b) => b.disponible).length;

  const alternar = (butaca) => {
    setSeleccion((actual) => {
      const nueva = new Map(actual);
      if (nueva.has(butaca.id)) nueva.delete(butaca.id);
      else if (nueva.size >= MAX_BUTACAS_POR_COMPRA) {
        toast.info('Llegaste al máximo', `Podés comprar hasta ${MAX_BUTACAS_POR_COMPRA} entradas por compra.`);
        return actual;
      } else nueva.set(butaca.id, butaca);
      return nueva;
    });
  };

  const aplicarPromo = (e) => {
    e.preventDefault();
    const buscado = codigo.trim().toLowerCase();
    if (!buscado) return setErrorPromo('Ingresá un código.');
    const encontrada = promociones.find((p) => p.codigo.toLowerCase() === buscado);
    if (!encontrada) return setErrorPromo('No encontramos una promoción con ese código.');
    if (!promoVigente(encontrada)) return setErrorPromo('Esta promoción no está vigente hoy.');
    setErrorPromo('');
    setPromo(encontrada);
    toast.exito('Promoción aplicada', `${Number(encontrada.porcentajeDescuento)}% de descuento sobre el total.`);
  };

  const reservar = async () => {
    setProcesando(true);
    try {
      const nueva = await api.compras.crear({
        clienteId: sesion.clienteId,
        funcionId: funcion.id,
        butacasIds: butacasSeleccionadas.map((b) => b.id),
        codigoPromocion: promo?.codigo ?? null,
      });
      pendiente.current = nueva.id;
      setCompra(nueva);
      setPagoRechazado(false);
      setVenceEn(Date.now() + MINUTOS_PARA_PAGAR * 60000);
      setPaso(2);
      return nueva;
    } catch (err) {
      if (err.status === 409) {
        await volverAButacas();
        toast.error('Alguien te ganó de mano', 'Una o más butacas ya no están disponibles. Elegí otras.');
      } else {
        toast.error('No pudimos reservar tus butacas', err.message);
      }
      return null;
    } finally {
      setProcesando(false);
    }
  };

  const pagar = async (datos) => {
    setProcesando(true);
    try {
      const pago = await api.pagos.registrar(compra.id, datos);
      if (pago.estado === 'APROBADO') {
        pendiente.current = null;
        const confirmada = await api.compras.obtener(compra.id).catch(() => ({ ...compra, estado: 'CONFIRMADA', pago }));
        setCompra(confirmada);
        setVenceEn(null);
        setPaso(3);
        setParams({}, { replace: true });
        toast.exito('¡Pago aprobado!', 'Tus entradas ya están listas.');
      } else {
        setPagoRechazado(true);
      }
    } catch (err) {
      toast.error('No pudimos procesar el pago', err.message);
    } finally {
      setProcesando(false);
    }
  };

  const reintentar = async () => {
    setProcesando(true);
    await liberar(compra.id);
    setCompra(null);
    setProcesando(false);
    await reservar();
  };

  const cancelarCompra = async () => {
    setProcesando(true);
    await liberar(compra.id);
    setProcesando(false);
    setConfirmarCancelacion(false);
    await volverAButacas({ titulo: 'Compra cancelada', texto: 'Liberamos las butacas que habías reservado.' });
  };

  const totalFinal = compra ? Number(compra.total) : totalEstimado;

  return (
    <div className="contenedor seccion seccion--offset compra">
      <div className="compra__cabecera">
        {paso === 0 && (
          <Link to={`/peliculas/${funcion.peliculaId}`} className="volver">
            <ArrowLeft size={18} aria-hidden="true" /> Cambiar función
          </Link>
        )}
        {paso === 1 && (
          <button type="button" className="volver" onClick={() => setPaso(0)}>
            <ArrowLeft size={18} aria-hidden="true" /> Volver a las butacas
          </button>
        )}
        <h1 className="titulo-pagina">{paso === 3 ? 'Compra confirmada' : 'Comprar entradas'}</h1>
        <Stepper pasos={PASOS} actual={paso} />
      </div>

      {paso === 3 ? (
        <PasoConfirmacion compra={compra} funcion={funcion} />
      ) : (
        <div className="compra__layout">
          <div className="compra__principal">
            {paso === 0 && (
              <section className="panel" aria-labelledby="titulo-butacas">
                <div className="panel__cabecera">
                  <h2 id="titulo-butacas" className="panel__titulo">
                    Elegí tus butacas
                  </h2>
                  <p className="texto-secundario">
                    {disponibles} de {butacas.length} disponibles · máximo {MAX_BUTACAS_POR_COMPRA} por compra
                  </p>
                </div>
                {disponibles === 0 ? (
                  <EmptyState icono={WarningCircle} titulo="Función agotada" descripcion="No quedan butacas libres para este horario.">
                    <ButtonLink to={`/peliculas/${funcion.peliculaId}`}>Ver otros horarios</ButtonLink>
                  </EmptyState>
                ) : (
                  <SeatMap butacas={butacas} seleccionadas={seleccion} onAlternar={alternar} precioBase={funcion.precioBase} />
                )}
              </section>
            )}

            {paso === 1 && (
              <section className="panel" aria-labelledby="titulo-resumen">
                <h2 id="titulo-resumen" className="panel__titulo">
                  Revisá tu compra
                </h2>
                <table className="tabla tabla--compacta">
                  <caption className="sr-only">Detalle de entradas</caption>
                  <thead>
                    <tr>
                      <th scope="col">Butaca</th>
                      <th scope="col">Tipo</th>
                      <th scope="col" className="alinear-derecha">
                        Precio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {butacasSeleccionadas.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.codigo}</strong>
                        </td>
                        <td>{TIPOS_BUTACA[b.tipo]}</td>
                        <td className="alinear-derecha numero">{formatearPrecio(precioButaca(funcion.precioBase, b.tipo))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <form className="promo-form" onSubmit={aplicarPromo} noValidate>
                  <label htmlFor="codigo-promo" className="field__label">
                    <Tag size={18} aria-hidden="true" /> ¿Tenés un código de descuento?
                  </label>
                  {promo ? (
                    <div className="promo-aplicada">
                      <span>
                        <strong>{promo.codigo}</strong> · {Number(promo.porcentajeDescuento)}% OFF aplicado
                      </span>
                      <button
                        type="button"
                        className="boton-texto"
                        onClick={() => {
                          setPromo(null);
                          setCodigo('');
                        }}
                      >
                        <X size={16} aria-hidden="true" /> Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="promo-form__fila">
                      <input
                        id="codigo-promo"
                        className="input"
                        value={codigo}
                        onChange={(e) => {
                          setCodigo(e.target.value.toUpperCase());
                          setErrorPromo('');
                        }}
                        placeholder="Ej: ESTRENO10"
                        aria-invalid={Boolean(errorPromo)}
                        aria-describedby={errorPromo ? 'error-promo' : undefined}
                        autoComplete="off"
                      />
                      <Button type="submit" variante="secondary">
                        Aplicar
                      </Button>
                    </div>
                  )}
                  {errorPromo && (
                    <p id="error-promo" className="field__error" role="alert">
                      {errorPromo}
                    </p>
                  )}
                </form>

                <div className="alerta alerta--info">
                  <Info size={20} aria-hidden="true" />
                  Al continuar reservamos tus butacas por {MINUTOS_PARA_PAGAR} minutos para que completes el pago.
                </div>
              </section>
            )}

            {paso === 2 && compra && (
              <>
                {pagoRechazado ? (
                  <section className="panel" aria-labelledby="titulo-rechazo">
                    <div className="alerta alerta--error" role="alert">
                      <WarningCircle size={22} aria-hidden="true" />
                      <div>
                        <strong id="titulo-rechazo">El pago fue rechazado</strong>
                        <p>Tu medio de pago no autorizó la operación. Podés intentar con otro medio: mantenemos las mismas butacas.</p>
                      </div>
                    </div>
                    <div className="panel__acciones">
                      <Button variante="ghost" onClick={() => setConfirmarCancelacion(true)} disabled={procesando}>
                        Cancelar compra
                      </Button>
                      <Button onClick={reintentar} cargando={procesando}>
                        Intentar con otro medio
                      </Button>
                    </div>
                  </section>
                ) : (
                  <PasoPago total={totalFinal} tiempoRestante={tiempo} procesando={procesando} onPagar={pagar} onCancelar={() => setConfirmarCancelacion(true)} />
                )}
              </>
            )}
          </div>

          <ResumenCompra funcion={funcion} pelicula={pelicula} butacas={butacasSeleccionadas} promo={compra ? promo ?? { codigo: 'aplicada' } : promo} total={totalFinal}>
            {paso === 0 && (
              <Button tamano="lg" bloque disabled={seleccion.size === 0} onClick={() => setPaso(1)}>
                Continuar <ArrowRight size={18} aria-hidden="true" />
              </Button>
            )}
            {paso === 1 && (
              <Button tamano="lg" bloque cargando={procesando} onClick={reservar}>
                Reservar y pagar
              </Button>
            )}
          </ResumenCompra>
        </div>
      )}

      <ConfirmDialog
        abierto={confirmarCancelacion}
        onCerrar={() => setConfirmarCancelacion(false)}
        onConfirmar={cancelarCompra}
        cargando={procesando}
        peligroso
        titulo="¿Cancelar la compra?"
        mensaje="Vamos a liberar las butacas reservadas y no se realizará ningún cobro."
        textoConfirmar="Sí, cancelar"
      />
    </div>
  );
}
