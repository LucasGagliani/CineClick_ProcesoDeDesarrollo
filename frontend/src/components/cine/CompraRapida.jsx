import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightning, Ticket } from '@phosphor-icons/react';
import Button from '../ui/Button';
import { FORMATOS, claveDia, etiquetaDia, formatearHora } from '../../utils/format';
import { ordenarPorInicio } from '../../utils/negocio';

export default function CompraRapida({ funciones }) {
  const navegar = useNavigate();
  const [peliculaId, setPeliculaId] = useState('');
  const [cineId, setCineId] = useState('');
  const [dia, setDia] = useState('');
  const [funcionId, setFuncionId] = useState('');

  const ordenadas = useMemo(() => ordenarPorInicio(funciones), [funciones]);

  const peliculas = useMemo(() => {
    const mapa = new Map();
    ordenadas.forEach((f) => mapa.set(f.peliculaId, f.peliculaTitulo));
    return [...mapa].sort((a, b) => a[1].localeCompare(b[1]));
  }, [ordenadas]);

  const porPelicula = ordenadas.filter((f) => String(f.peliculaId) === peliculaId);

  const cines = useMemo(() => {
    const mapa = new Map();
    porPelicula.forEach((f) => mapa.set(f.cineId, f.cineNombre));
    return [...mapa];
  }, [porPelicula]);

  const porCine = porPelicula.filter((f) => String(f.cineId) === cineId);
  const dias = [...new Set(porCine.map((f) => claveDia(f.fechaHoraInicio)))];
  const horarios = porCine.filter((f) => claveDia(f.fechaHoraInicio) === dia);

  const enviar = (e) => {
    e.preventDefault();
    if (funcionId) navegar(`/comprar/${funcionId}`);
  };

  return (
    <form className="compra-rapida" onSubmit={enviar} aria-labelledby="compra-rapida-titulo">
      <h2 id="compra-rapida-titulo" className="compra-rapida__titulo">
        <Lightning size={22} weight="fill" aria-hidden="true" />
        Compra rápida
      </h2>
      <div className="compra-rapida__campos">
        <label className="select-flotante">
          <span>Película</span>
          <select
            value={peliculaId}
            onChange={(e) => {
              setPeliculaId(e.target.value);
              setCineId('');
              setDia('');
              setFuncionId('');
            }}
          >
            <option value="">Elegí una película</option>
            {peliculas.map(([id, titulo]) => (
              <option key={id} value={id}>
                {titulo}
              </option>
            ))}
          </select>
        </label>
        <label className="select-flotante">
          <span>Cine</span>
          <select
            value={cineId}
            disabled={!peliculaId}
            onChange={(e) => {
              setCineId(e.target.value);
              setDia('');
              setFuncionId('');
            }}
          >
            <option value="">Elegí un cine</option>
            {cines.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="select-flotante">
          <span>Día</span>
          <select
            value={dia}
            disabled={!cineId}
            onChange={(e) => {
              setDia(e.target.value);
              setFuncionId('');
            }}
          >
            <option value="">Elegí un día</option>
            {dias.map((d) => (
              <option key={d} value={d}>
                {etiquetaDia(d)}
              </option>
            ))}
          </select>
        </label>
        <label className="select-flotante">
          <span>Horario</span>
          <select value={funcionId} disabled={!dia} onChange={(e) => setFuncionId(e.target.value)}>
            <option value="">Elegí un horario</option>
            {horarios.map((f) => (
              <option key={f.id} value={f.id}>
                {formatearHora(f.fechaHoraInicio)} · {FORMATOS[f.formato]} · {f.idioma}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" tamano="lg" disabled={!funcionId} className="compra-rapida__boton">
          <Ticket size={20} aria-hidden="true" />
          Comprar
        </Button>
      </div>
    </form>
  );
}
