import { Armchair, QrCode, Ticket } from '@phosphor-icons/react';

const BENEFICIOS = [
  { icono: Ticket, texto: 'Comprá tus entradas sin hacer fila' },
  { icono: Armchair, texto: 'Elegí tu butaca en el mapa de la sala' },
  { icono: QrCode, texto: 'Mostrá el QR en el celular y entrá' },
];

export default function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className="auth">
      <aside className="auth__visual" aria-hidden="true">
        <div className="auth__luces" />
        <div className="auth__visual-contenido">
          <p className="auth__lema">
            La magia del cine
            <br />
            empieza con un <span>click</span>.
          </p>
          <ul className="auth__beneficios">
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <li key={texto}>
                <Icono size={22} /> {texto}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section className="auth__panel">
        <div className="auth__tarjeta">
          <h1 className="auth__titulo">{titulo}</h1>
          <p className="texto-secundario auth__subtitulo">{subtitulo}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
