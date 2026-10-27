# CineClick – Frontend

Frontend de CineClick para la etapa 2 del TPO de Aplicaciones Interactivas. Es una SPA (Single Page Application) que consume la API REST del backend de este mismo repositorio.

**Stack:** React 18, Vite 5, React Router 6, Phosphor Icons y `qrcode.react`. Estilos con CSS propio basado en tokens de diseño (sin frameworks de UI).

## Cuentas de prueba

| Rol | Email | Contraseña | Disponible |
| --- | --- | --- | --- |
| Administrador | `admin@cineclick.com` | `admin123` | Siempre (la crea el backend al arrancar) |
| Cliente | `cliente@cineclick.com` | `cliente123` | Después de correr `npm run seed` |

También se puede crear un cliente nuevo desde "Registrarme".

| Para probar | Dato |
| --- | --- |
| Códigos de descuento | `ESTRENO10` (siempre), `CINEFAN20` y `MIERCOLES` (con `npm run seed`) |
| Pago rechazado | Tarjeta `4000 0000 0000 0002` |
| Pago aprobado | Cualquier otra tarjeta de 16 dígitos con vencimiento futuro, Mercado Pago o efectivo |

## Cómo correrlo

1. Levantar el backend (desde la raíz del repositorio):

   ```bash
   ./mvnw spring-boot:run
   ```

2. En otra terminal, instalar dependencias y levantar el frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Abrir `http://localhost:5173`.

Vite redirige todo lo que empieza con `/api` a `http://localhost:8080`, así que no hace falta configurar CORS. Si el backend corre en otra URL, copiar `.env.example` como `.env` y cambiar `VITE_BACKEND_URL`.

### Datos de demo (opcional)

El backend arranca con 2 películas y un cine. Para tener una cartelera más completa (10 películas, 3 cines, más de 90 funciones, promociones y el cliente de prueba), con el backend corriendo:

```bash
npm run seed
```

El script solo usa la API (los mismos endpoints que usa la app) y se puede correr más de una vez sin duplicar datos. Las funciones se programan para los 4 días siguientes, así que si pasan unos días conviene volver a correrlo.

### Build de producción

```bash
npm run build
npm run preview
```

## Funcionalidades

### Sitio público (cliente)

- **Inicio:** carrusel principal de películas destacadas (autoplay que se pausa al pasar el mouse, con teclado, swipe en celular y botón de pausa), barra de **compra rápida** estilo Hoyts (película → cine → día → horario), carrusel de **próximas funciones** filtrable por día, grilla de cartelera por género, promociones vigentes y cines.
- **Cartelera:** búsqueda por título y filtros por género, formato y "solo con funciones".
- **Detalle de película:** sinopsis, ficha técnica y horarios agrupados por día, cine, formato e idioma.
- **Cines:** listado por ciudad y cartelera del día de cada complejo.
- **Promociones:** códigos vigentes, con botón para copiarlos.
- **Registro e ingreso** con validaciones iguales a las del backend.
- **Compra de entradas** en 4 pasos:
  1. Mapa de la sala con butacas normales, VIP (+30%) y accesibles (−20%), ocupadas y seleccionadas.
  2. Resumen y código de descuento.
  3. Pago con cuenta regresiva de 10 minutos, tarjeta, Mercado Pago o efectivo.
  4. Confirmación con las entradas y su código QR.
- **Mis compras:** próximas, pendientes de pago e historial; ver entradas con QR, completar o reintentar un pago pendiente y cancelar.
- **Mi perfil:** edición de datos personales sin enviar ni modificar la contraseña y un formulario independiente para cambiarla, verificando la contraseña actual y la confirmación de la nueva.

### Panel de administración (`/admin`)

- **Resumen:** recaudación, entradas vendidas, indicadores y ocupación de las próximas funciones.
- **Funciones:** alta, edición y cancelación con filtros. El formulario limita los formatos a los de la película, muestra el horario de fin estimado y explica los errores de superposición.
- **Películas:** alta, edición y baja lógica, con vista previa del póster.
- **Cines y salas:** alta, edición y baja de cines; alta de salas con vista previa de la distribución de butacas.
- **Promociones:** alta y listado.
- **Clientes:** búsqueda, compras de cada cliente y desactivación.
- **Compras:** todas las compras, filtro por estado, entradas y cancelación.

### Cómo se simula el pago

El backend rechaza el pago cuando el token contiene la palabra `rechazar`. En el front eso se activa con la tarjeta de prueba **`4000 0000 0000 0002`**. Cualquier otra tarjeta válida aprueba el pago. Si el pago se rechaza, la app cancela la compra pendiente y vuelve a reservar las mismas butacas para intentar con otro medio.

### Butacas reservadas

Al confirmar el resumen se crea la compra (estado `PENDIENTE_PAGO`) y las butacas quedan reservadas. El front las libera automáticamente (cancelando la compra) si:

- se agota el tiempo de pago,
- el usuario cancela,
- el usuario sale de la pantalla o cierra la pestaña.

## Verificación de perfil y contraseña

Con el backend y el frontend ejecutándose, `npm run test:perfil` comprueba el registro, la edición del perfil sin contraseña, confirmaciones distintas, contraseña actual incorrecta, cambio correcto e ingreso con la contraseña nueva en otra sesión. La prueba crea un usuario ficticio con email único. En Windows usa Microsoft Edge; en otros sistemas se puede instalar Chromium con `npx playwright install chromium`.

Si el frontend corre en otro puerto, definir `FRONTEND_URL`. Para usar otro canal de navegador, definir `BROWSER_CHANNEL`.

```powershell
$env:FRONTEND_URL = 'http://127.0.0.1:5174'
npm run test:perfil
```

La edición del perfil usa `PUT /api/clientes/{id}` con nombre, apellido, email y teléfono. El cambio de contraseña usa `PUT /api/clientes/{id}/password` con `passwordActual` y `passwordNueva`; espera una respuesta 204 y limpia sus campos. El backend conserva los accesos anteriores mediante una migración de contraseñas a hashes.

## Estructura de carpetas

```text
src/
  api/          cliente HTTP y endpoints del backend
  context/      sesión (AuthContext) y avisos (ToastContext)
  hooks/        useFetch, useFormulario, useCountdown, useDocumentTitle
  utils/        formatos, reglas de negocio replicadas (precios, vigencias) y validaciones
  components/
    ui/         botones, campos, modal, badges, estados vacíos y de error
    layout/     navbar, footer, guards de rutas, layout de login
    cine/       carruseles, tarjetas, mapa de butacas, ticket con QR
  pages/        pantallas públicas, compra y panel de administración
  styles/       tokens de diseño y hojas de estilo por área
scripts/
  seed-demo.mjs carga de datos de demo vía API
```

## Diseño

- Tema oscuro, como en la industria del cine: fondo casi negro, **rojo** como color principal (acciones de compra), **dorado** para VIP, IMAX y promociones.
- Tipografía **Bebas Neue** para los títulos (estilo marquesina) e **Inter** para los textos.
- Accesibilidad:
  - contraste AA y foco visible;
  - navegación por teclado, link "Saltar al contenido" y etiquetas en todos los campos;
  - respeta `prefers-reduced-motion`;
  - responsive desde 375 px.
