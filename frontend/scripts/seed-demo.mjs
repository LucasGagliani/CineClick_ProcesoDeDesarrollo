const API = `${process.env.VITE_BACKEND_URL || 'http://localhost:8080'}/api`;
const TMDB = 'https://image.tmdb.org/t/p/w500';

const PELICULAS = [
  {
    titulo: 'Dune: Parte Dos',
    sinopsis: 'Paul Atreides se une a Chani y a los Fremen mientras busca venganza contra quienes destruyeron a su familia, enfrentando una elección entre el amor de su vida y el destino del universo.',
    duracionMinutos: 166,
    clasificacion: '+13',
    genero: 'CIENCIA_FICCION',
    idioma: 'Subtitulada',
    formatosDisponibles: ['DOS_D', 'IMAX', 'CUATRO_D'],
    urlPoster: `${TMDB}/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg`,
  },
  {
    titulo: 'Gladiador II',
    sinopsis: 'Años después de presenciar la muerte de Máximo, Lucio es obligado a entrar al Coliseo y debe mirar hacia su pasado para devolverle la gloria a Roma.',
    duracionMinutos: 148,
    clasificacion: '+16',
    genero: 'ACCION',
    idioma: 'Subtitulada',
    formatosDisponibles: ['DOS_D', 'IMAX'],
    urlPoster: `${TMDB}/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg`,
  },
  {
    titulo: 'Deadpool & Wolverine',
    sinopsis: 'Un apático Wade Wilson es reclutado por la Autoridad de Variación Temporal y debe convencer a un Wolverine reacio a salvar su universo.',
    duracionMinutos: 128,
    clasificacion: '+16',
    genero: 'ACCION',
    idioma: 'Castellano',
    formatosDisponibles: ['DOS_D', 'TRES_D', 'CUATRO_D'],
    urlPoster: `${TMDB}/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg`,
  },
  {
    titulo: 'Oppenheimer',
    sinopsis: 'La historia del físico J. Robert Oppenheimer y su papel en el desarrollo de la bomba atómica durante la Segunda Guerra Mundial.',
    duracionMinutos: 180,
    clasificacion: '+16',
    genero: 'DRAMA',
    idioma: 'Subtitulada',
    formatosDisponibles: ['DOS_D', 'IMAX'],
    urlPoster: `${TMDB}/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg`,
  },
  {
    titulo: 'Moana 2',
    sinopsis: 'Moana recibe un llamado inesperado de sus ancestros y emprende un viaje hacia los mares lejanos de Oceanía junto a Maui y una nueva tripulación.',
    duracionMinutos: 100,
    clasificacion: 'ATP',
    genero: 'ANIMACION',
    idioma: 'Castellano',
    formatosDisponibles: ['DOS_D', 'TRES_D'],
    urlPoster: `${TMDB}/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg`,
  },
  {
    titulo: 'Alien: Romulus',
    sinopsis: 'Un grupo de jóvenes colonos explora una estación espacial abandonada y se enfrenta a la forma de vida más aterradora del universo.',
    duracionMinutos: 119,
    clasificacion: '+16',
    genero: 'TERROR',
    idioma: 'Subtitulada',
    formatosDisponibles: ['DOS_D', 'CUATRO_D'],
    urlPoster: `${TMDB}/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg`,
  },
  {
    titulo: 'Robot Salvaje',
    sinopsis: 'La robot Roz naufraga en una isla deshabitada y aprende a adaptarse al entorno hostil, creando vínculos con los animales y adoptando a un pequeño ganso huérfano.',
    duracionMinutos: 102,
    clasificacion: 'ATP',
    genero: 'ANIMACION',
    idioma: 'Castellano',
    formatosDisponibles: ['DOS_D', 'TRES_D'],
    urlPoster: `${TMDB}/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg`,
  },
  {
    titulo: 'Barbie',
    sinopsis: 'Barbie vive en Barbieland, donde todo es perfecto, hasta que una crisis existencial la lleva al mundo real junto a Ken.',
    duracionMinutos: 114,
    clasificacion: '+13',
    genero: 'COMEDIA',
    idioma: 'Castellano',
    formatosDisponibles: ['DOS_D'],
    urlPoster: `${TMDB}/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg`,
  },
];

const CINES = [
  {
    cine: { nombre: 'CineClick Palermo', direccion: 'Av. Santa Fe 3253', ciudad: 'Buenos Aires', telefono: '011-4000-2000' },
    salas: [
      { nombre: 'Sala 1', numero: 1, tipo: 'TRADICIONAL', cantidadFilas: 8, butacasPorFila: 12 },
      { nombre: 'Sala Premium', numero: 2, tipo: 'PREMIUM', cantidadFilas: 6, butacasPorFila: 10 },
      { nombre: 'Sala 4D', numero: 3, tipo: 'CUATRO_D', cantidadFilas: 6, butacasPorFila: 10 },
    ],
  },
  {
    cine: { nombre: 'CineClick Nuevocentro', direccion: 'Duarte Quirós 1400', ciudad: 'Córdoba', telefono: '0351-400-3000' },
    salas: [
      { nombre: 'Sala 1', numero: 1, tipo: 'TRADICIONAL', cantidadFilas: 8, butacasPorFila: 14 },
      { nombre: 'Sala IMAX', numero: 2, tipo: 'IMAX', cantidadFilas: 9, butacasPorFila: 16 },
    ],
  },
];

const PROMOS = [
  { codigo: 'CINEFAN20', descripcion: '20% de descuento para socios CineFan', porcentajeDescuento: 20, dias: 60 },
  { codigo: 'MIERCOLES', descripcion: '25% off en todas las funciones de mitad de semana', porcentajeDescuento: 25, dias: 30 },
];

const CLIENTE_DEMO = { nombre: 'Lucía', apellido: 'Fernández', email: 'cliente@cineclick.com', password: 'cliente123', telefono: '11 5555-0101' };

const HORARIOS = [13, 15.5, 18, 20.5, 23];
const PRECIO_POR_TIPO = { TRADICIONAL: 5200, PREMIUM: 7400, IMAX: 8900, CUATRO_D: 9800 };
const FORMATO_POR_TIPO = { TRADICIONAL: ['DOS_D', 'TRES_D'], PREMIUM: ['DOS_D', 'TRES_D'], IMAX: ['IMAX'], CUATRO_D: ['CUATRO_D'] };

async function api(path, opciones = {}) {
  const respuesta = await fetch(`${API}${path}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json' },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined,
  });
  const texto = await respuesta.text();
  const datos = texto ? JSON.parse(texto) : null;
  if (!respuesta.ok) throw new Error(datos?.mensaje || `HTTP ${respuesta.status}`);
  return datos;
}

const dos = (n) => String(n).padStart(2, '0');
const fechaLocal = (d) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
const localDateTime = (d) => `${fechaLocal(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}:00`;

async function main() {
  console.log(`Cargando datos de demo en ${API}\n`);

  const existentes = new Set((await api('/peliculas')).map((p) => p.titulo.toLowerCase()));
  for (const pelicula of PELICULAS) {
    if (existentes.has(pelicula.titulo.toLowerCase())) continue;
    await api('/peliculas', { method: 'POST', body: { ...pelicula, fechaEstreno: fechaLocal(new Date(Date.now() - 20 * 86400000)) } });
    console.log(`  + Película: ${pelicula.titulo}`);
  }

  const cinesExistentes = new Set((await api('/cines')).map((c) => c.nombre.toLowerCase()));
  for (const { cine, salas } of CINES) {
    if (cinesExistentes.has(cine.nombre.toLowerCase())) continue;
    const creado = await api('/cines', { method: 'POST', body: cine });
    for (const sala of salas) await api(`/cines/${creado.id}/salas`, { method: 'POST', body: sala });
    console.log(`  + Cine: ${cine.nombre} (${salas.length} salas)`);
  }

  const promos = new Set((await api('/promociones')).map((p) => p.codigo.toLowerCase()));
  for (const { dias, ...promo } of PROMOS) {
    if (promos.has(promo.codigo.toLowerCase())) continue;
    const hoy = new Date();
    await api('/promociones', {
      method: 'POST',
      body: { ...promo, fechaInicio: fechaLocal(new Date(hoy.getTime() - 86400000)), fechaFin: fechaLocal(new Date(hoy.getTime() + dias * 86400000)), activa: true },
    });
    console.log(`  + Promoción: ${promo.codigo}`);
  }

  try {
    await api('/clientes', { method: 'POST', body: CLIENTE_DEMO });
    console.log(`  + Cliente demo: ${CLIENTE_DEMO.email} / ${CLIENTE_DEMO.password}`);
  } catch {
    console.log(`  = Cliente demo ya existente: ${CLIENTE_DEMO.email}`);
  }

  const peliculas = await api('/peliculas');
  const cines = await api('/cines');
  const funciones = await api('/funciones');
  const ocupadas = new Set(funciones.filter((f) => f.estado !== 'CANCELADA').map((f) => `${f.salaId}|${f.fechaHoraInicio.slice(0, 10)}`));

  let creadas = 0;
  let indice = 0;
  for (let dia = 0; dia < 4; dia++) {
    for (const cine of cines) {
      for (const sala of cine.salas.filter((s) => s.activa)) {
        const base = new Date();
        base.setDate(base.getDate() + dia);
        if (ocupadas.has(`${sala.id}|${fechaLocal(base)}`)) continue;
        let finAnterior = null;
        for (const hora of HORARIOS) {
          const candidatas = peliculas.filter((p) => p.formatosDisponibles.some((f) => FORMATO_POR_TIPO[sala.tipo].includes(f)));
          if (candidatas.length === 0) break;
          const pelicula = candidatas[indice++ % candidatas.length];
          const formato = FORMATO_POR_TIPO[sala.tipo].find((f) => pelicula.formatosDisponibles.includes(f));
          const inicio = new Date(base);
          inicio.setHours(Math.floor(hora), (hora % 1) * 60, 0, 0);
          if (finAnterior && inicio < finAnterior) inicio.setTime(Math.ceil((finAnterior.getTime() + 10 * 60000) / (15 * 60000)) * 15 * 60000);
          if (inicio <= new Date(Date.now() + 30 * 60000) || inicio.getHours() < 12) continue;
          try {
            const funcion = await api('/funciones', {
              method: 'POST',
              body: { peliculaId: pelicula.id, salaId: sala.id, fechaHoraInicio: localDateTime(inicio), precioBase: PRECIO_POR_TIPO[sala.tipo], formato, idioma: pelicula.idioma },
            });
            finAnterior = new Date(funcion.fechaHoraFin);
            creadas++;
          } catch (error) {
            finAnterior = new Date(inicio.getTime() + (pelicula.duracionMinutos + 20) * 60000);
          }
        }
      }
    }
  }
  console.log(`  + ${creadas} funciones programadas para los próximos 4 días`);
  console.log('\nListo. Admin: admin@cineclick.com / admin123');
}

main().catch((error) => {
  console.error(`\nNo se pudo cargar la demo: ${error.message}`);
  console.error('Revisá que el backend esté corriendo en http://localhost:8080');
  process.exit(1);
});
