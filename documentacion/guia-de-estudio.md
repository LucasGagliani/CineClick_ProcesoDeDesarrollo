# CineClick: guía completa de estudio y defensa

Revisión del código local: **30 de septiembre de 2026**, commit base **bfe2038**. Etapa: backend. Esta guía describe lo que está implementado, incluyendo sus límites. No implica que todos los requisitos del TP estén cubiertos ni agrega funcionalidades. Las justificaciones explican por qué las decisiones son adecuadas para este diseño; no atribuyen motivos personales que no estén documentados.

## Índice

1. [Presentación del proyecto](#1-presentación-del-proyecto)
2. [Tecnologías y responsabilidades](#2-tecnologías-y-responsabilidades)
3. [Arquitectura y patrones](#3-arquitectura-y-patrones)
4. [Arranque y configuración](#4-arranque-y-configuración)
5. [Entidades, atributos y relaciones](#5-entidades-atributos-y-relaciones)
6. [Métodos de las entidades](#6-métodos-de-las-entidades)
7. [Controllers: todos los endpoints](#7-controllers-todos-los-endpoints)
8. [Services: método por método](#8-services-método-por-método)
9. [Repositories y consultas](#9-repositories-y-consultas)
10. [DTOs y conversión](#10-dtos-y-conversión)
11. [Validaciones y errores](#11-validaciones-y-errores)
12. [Una compra de principio a fin](#12-una-compra-de-principio-a-fin)
13. [Transacciones y concurrencia](#13-transacciones-y-concurrencia)
14. [JPA, Hibernate y SQL](#14-jpa-hibernate-y-sql)
15. [Java y anotaciones para explicar](#15-java-y-anotaciones-para-explicar)
16. [Tests: qué comprueban](#16-tests-qué-comprueban)
17. [Límites reales del proyecto](#17-límites-reales-del-proyecto)
18. [Preguntas de defensa con respuestas](#18-preguntas-de-defensa-con-respuestas)
19. [Demostración manual](#19-demostración-manual)
20. [Plan de estudio y repaso final](#20-plan-de-estudio-y-repaso-final)

## 1. Presentación del proyecto

CineClick es el backend de una aplicación de venta de entradas de cine. Centraliza películas, cines, salas, butacas y funciones; registra clientes; permite crear compras, aplicar promociones, registrar pagos simulados y cancelar compras.

Una **película** es el contenido: título, duración y género. Una **función** es una proyección concreta de esa película en una sala, en un horario, con un precio. Una **butaca** es un asiento físico de una sala. Una **entrada** vincula esa butaca con una función y una compra. Separar estos conceptos permite vender la misma butaca en funciones diferentes.

Una presentación oral posible:

> CineClick es una API HTTP con Java y Spring Boot para gestionar un cine y vender entradas. Organizamos el backend en controllers, services, repositories y entidades. Intercambiamos JSON mediante DTOs y persistimos los datos en una base SQL H2 usando JPA e Hibernate. El caso central es crear una compra: validamos función, butacas y promoción, calculamos el importe en el servidor y guardamos todo dentro de una transacción. Una restricción única en la base evita dos entradas vigentes para el mismo asiento y función. Los pagos son simulados y el login actual es básico.

**Alcance actual:** no hay frontend definitivo, integración real con una pasarela, sincronización con nube ni autorización de endpoints por rol. Se prueba por HTTP. El proyecto contiene roles `ADMIN` y `CLIENTE`, pero almacenar un rol y devolverlo al iniciar sesión no aplica permisos automáticamente.

## 2. Tecnologías y responsabilidades

Fuente principal: [pom.xml](../pom.xml).

| Tecnología | Uso concreto | Por qué sirve aquí |
| --- | --- | --- |
| Java 21 | Lenguaje del backend; clases, interfaces, records, enums, Streams, fechas y `BigDecimal`. | Permite modelar el dominio con tipos y objetos; es la versión declarada para compilar. |
| Spring Boot 3.3.4 | Arranca la aplicación, configura componentes e integra dependencias. | Reduce la configuración manual del servidor, persistencia y aplicación. |
| Spring Framework | Contenedor de objetos e inyección de dependencias; transacciones declarativas. | Los componentes reciben sus colaboradores sin construirlos manualmente. |
| Spring Web / Spring MVC | Enrutamiento HTTP, controllers y conversión de peticiones/respuestas. | Expone la lógica del backend mediante una API que puede consumir un frontend. |
| Tomcat embebido | Servidor web que llega con el starter web. | La aplicación puede iniciarse sin instalar un servidor web Java aparte. |
| Jackson | Conversión entre JSON y objetos Java, integrado con Spring Web. | Serializa DTOs de respuesta y deserializa DTOs de entrada. |
| Spring Data JPA | Interfaces `JpaRepository` y consultas derivadas. | Evita escribir el acceso CRUD repetitivo y permite declarar consultas por nombre. |
| Jakarta Persistence / JPA | Contrato de persistencia y anotaciones como `@Entity`. | Describe cómo se relacionan objetos y tablas sin escribir SQL para cada operación. |
| Hibernate ORM | Implementación de JPA que administra entidades y genera SQL. | Ejecuta el mapeo, sigue cambios de objetos y coordina su persistencia. |
| H2 | Motor relacional SQL, en archivo para ejecución normal y en memoria para tests. | Permite persistencia real y restricciones sin instalar un servicio de base separado. |
| Jakarta Bean Validation | Reglas declaradas en DTOs: `@NotBlank`, `@Email`, `@Future`, etc. | Rechaza datos de entrada incorrectos antes de ejecutar el caso de uso. |
| Hibernate Validator | Proveedor de validación incluido por el starter de validation. | Ejecuta las reglas de Bean Validation. Es distinto de Hibernate ORM. |
| Lombok | Genera getters, setters y constructores de dependencias durante compilación. | Reduce código repetitivo; no reemplaza la lógica de negocio. |
| Maven y Maven Wrapper | Dependencias, compilación, tests y empaquetado. El wrapper apunta a Maven 3.9.11. | Reproduce el proceso de construcción sin exigir una instalación global de Maven. |
| JUnit Jupiter, Spring Boot Test, AssertJ | Pruebas y aserciones. | Verifican el arranque y flujos HTTP reales contra una base de pruebas. |
| Git | Versionado. | Permite revisar historial y trabajar con ramas. No ejecuta el backend. |
| PlantUML | Fuentes de diagramas `.puml` en `documentacion`. | Describe clases, capas y secuencia de compra como documentación. |

Las librerías transitivas las incorpora Maven a partir de los starters. Por ejemplo, Jackson no tiene una dependencia independiente escrita en nuestro `pom.xml`, pero se utiliza mediante Spring Web.

**Distinciones para memorizar:** Java es el lenguaje; Spring es el framework; Spring Boot facilita su configuración; JPA es una especificación; Hibernate es su implementación; Spring Data simplifica los repositories; H2 es el motor; SQL es el lenguaje de consulta. H2 ya usa SQL.

La elección de H2 facilita la demostración académica. No significa que H2 replique datos con una base remota ni que cambiar de motor sea siempre solo cambiar una URL: deben revisarse el dialecto, el esquema, las consultas y el comportamiento de las restricciones.

## 3. Arquitectura y patrones

### 3.1. Recorrido general

```text
Cliente HTTP (Postman, REST Client o futuro frontend)
  -> servidor web y Spring MVC
  -> Controller: recibe URL, parámetros y JSON
  -> Service: coordina validaciones y reglas del caso de uso
  -> Repository: consulta o modifica entidades
  -> Hibernate / JDBC
  -> H2: tablas, claves y restricciones

Respuesta: entidad -> DtoMapper -> DTO -> JSON -> cliente HTTP
Error: excepción -> GlobalExceptionHandler -> estado HTTP + ErrorResponseDTO
```

El paquete `model` no es un escalón adicional que se invoca como servidor: sus objetos son utilizados por services y repositories. El diagrama representa responsabilidades, no un proceso distinto por cada capa.

### 3.2. Qué hace cada paquete

| Paquete | Responsabilidad | Ejemplo |
| --- | --- | --- |
| `controller` | Contrato HTTP: rutas, parámetros, validación de entrada y estados exitosos. | `CompraController.crear()`. |
| `service` | Coordina reglas, acceso a datos y límites transaccionales. | `CompraService.crearCompra()`. |
| `repository` | Acceso a datos mediante interfaces de Spring Data. | `EntradaRepository.existsByFuncionIdAndButacaIdAndEstadoNot()`. |
| `model` | Estado y comportamientos propios del dominio, mapeados a tablas. | `Compra.calcularTotal()`, `Entrada.cancelar()`. |
| `dto` | Datos específicos de entrada/salida y conversión. | `CompraRequestDTO`, `CompraResponseDTO`, `DtoMapper`. |
| `exception` | Errores propios y traducción a HTTP. | `ButacaNoDisponibleException`, `GlobalExceptionHandler`. |
| `config` | Preparación de datos demostrativos. | `DataSeeder`. |

### 3.3. Patrones y decisiones que sí aparecen

**Arquitectura por capas.** Separamos la recepción HTTP, las reglas y la persistencia. Sirve para localizar cambios: una nueva regla de precios corresponde al negocio; una nueva ruta al controller; una consulta al repository. El backend se despliega como una aplicación, no como microservicios.

**Service Layer.** Los services ofrecen operaciones de aplicación, como registrar un cliente o comprar. Una compra puede necesitar varios repositories y otros services dentro de una misma transacción. Así el controller no coordina la compra por su cuenta.

**Repository, con responsabilidad de DAO.** Un DAO abstrae acceso a datos; un Repository presenta operaciones sobre entidades. En este proyecto los repositories de Spring Data cumplen esa responsabilidad de acceso. No hay clases `PeliculaDAO` escritas a mano ni consultas JDBC manuales.

**DTO (Data Transfer Object).** Define qué información se recibe o devuelve. Por ejemplo, el cliente recibe su nombre y email, pero no la contraseña ni toda la entidad `Usuario`. También evita serializar recursivamente relaciones como cine -> salas -> cine.

**Mapper.** `DtoMapper` concentra la conversión de entidades a DTOs de respuesta. Es una utilidad manual con métodos estáticos; no usamos MapStruct. Los métodos `copiarDatos` de los services cubren parte del sentido inverso.

**Inyección de dependencias e inversión de control.** Spring crea y conecta componentes. Los campos `private final` y `@RequiredArgsConstructor` generan constructores que Spring utiliza. No escribimos `new CompraService(...)` en el controller. Facilita identificar dependencias y sustituirlas en pruebas. Los services dependen de interfaces de repository, aunque se inyectan clases concretas para otros services.

**Manejo centralizado de excepciones.** `@RestControllerAdvice` evita repetir la construcción de errores en cada endpoint. El negocio lanza errores; el handler decide cómo comunicarlos por HTTP.

**ORM / Data Mapper de persistencia.** Hibernate transforma entidades y relaciones en operaciones SQL. No debe confundirse con `DtoMapper`, que convierte objetos de dominio en objetos de transporte.

**Baja lógica.** Es una estrategia de conservación de datos, no un patrón GoF: en vez de borrar físicamente, marcamos registros como inactivos o funciones como canceladas.

### 3.4. Cómo hablar de MVC

Usamos **Spring MVC** como infraestructura web y una organización por capas para una API REST. Los controllers reciben HTTP y el modelo representa el dominio. En esta etapa no se generan páginas HTML con vistas MVC de servidor: se devuelve JSON y la interfaz visual corresponde a la siguiente etapa.

Respuesta precisa: "Es un backend REST construido con Spring MVC, organizado en controller, service, repository y model; el frontend será su cliente HTTP". Evitá afirmar que hay plantillas HTML o que el repository es la vista.

### 3.5. Patrones que no conviene inventar en la defensa

No implementamos Strategy para los precios: hay `if` por tipo de butaca. No implementamos el patrón State: hay enums y métodos que asignan estados. No hay Builder de dominio, CQRS, Event Sourcing, Observer ni una arquitectura de microservicios. Que `DataSeeder` tenga métodos que crean objetos no basta para presentarlo como una jerarquía de Abstract Factory.

Los beans normalmente tienen alcance singleton dentro del contenedor Spring; eso no significa que hayamos escrito un Singleton manual con `getInstance()`.

## 4. Arranque y configuración

Fuentes: [CineClickApplication.java](../src/main/java/com/cineclick/CineClickApplication.java), [DataSeeder.java](../src/main/java/com/cineclick/config/DataSeeder.java), [application.properties](../src/main/resources/application.properties).

### 4.1. Punto de entrada

`CineClickApplication.main(String[] args)` llama a `SpringApplication.run(CineClickApplication.class, args)`. Boot crea el contexto, detecta componentes, configura servidor y persistencia y prepara la aplicación para atender HTTP.

`@SpringBootApplication` combina configuración de Spring Boot, autoconfiguración y escaneo de componentes. Al estar en `com.cineclick`, permite encontrar los componentes de los subpaquetes.

### 4.2. DataSeeder: todos sus métodos

| Método | Qué hace |
| --- | --- |
| `run(ApplicationArguments args)` | Spring lo ejecuta como `ApplicationRunner`. Dentro de una transacción asegura el admin, crea el dominio de demo únicamente si no hay películas **y** no hay cines, y crea la promo si no hay promociones. No usa los argumentos recibidos. |
| `crearUsuariosDemo()` | Si no existe `admin@cineclick.com`, guarda un `Usuario` con rol `ADMIN`, nombre Admin CineClick y contraseña de demo `admin123`. No crea un `Cliente` para ese admin. |
| `crearDominioDemo()` | Guarda Interestelar e Intensamente 2; crea CineClick Abasto, una sala tradicional de 40 butacas y una IMAX de 28; crea tres funciones a futuro. Usa los helpers siguientes. |
| `nuevaPelicula(...)` | Construye una película con los datos recibidos y fecha de estreno de un mes atrás. Devuelve el objeto; quien lo invoca lo guarda. |
| `nuevaSala(nombre, numero, tipo, filas, butacasPorFila)` | Construye la sala y sus butacas. Filas A, B, etc.; los números 1 y 2 de **cada fila** son VIP, los demás normales. No guarda directamente. |
| `crearFuncion(pelicula, sala, inicio, precio, formato, idioma)` | Construye una función programada, calcula su fin y la guarda. No pasa por las validaciones de `FuncionService`. |
| `crearPromocionesDemo()` | Guarda `ESTRENO10`, 10% de descuento, vigente desde ayer hasta dentro de dos meses respecto de la fecha de creación. |

El seeder no regenera todos los datos en cada arranque. Si la base persiste una semana, las funciones iniciales pueden haber pasado. Tampoco completa automáticamente cualquier estado parcialmente cargado: la condición de dominio exige ambas tablas vacías.

### 4.3. Configuración explicada

| Propiedad | Efecto |
| --- | --- |
| `spring.application.name=cineclick-backend` | Nombre de la aplicación. |
| `server.port=8080` | Puerto HTTP por defecto. |
| `jdbc:h2:file:./data/cineclick` | Base H2 persistida en archivo, relativo al directorio de ejecución. |
| `DATABASE_TO_LOWER=TRUE` | Configura el tratamiento de identificadores de H2 en minúsculas. No convierte emails ni textos de usuarios a minúscula. |
| `AUTO_SERVER=TRUE` | Habilita el modo mixto automático de H2 para compartir acceso al archivo en condiciones compatibles. No sincroniza bases ni configura una nube. |
| `driver-class-name=org.h2.Driver` | Driver JDBC del motor. |
| Usuario `sa`, contraseña vacía | Credenciales locales de la base para esta configuración de desarrollo. |
| `spring.h2.console.enabled=true` y path `/h2-console` | Habilitan una herramienta web para consultar la base; no son el frontend de CineClick. |
| `ddl-auto=update` | Hibernate intenta actualizar el esquema según las entidades. No es una herramienta completa de migraciones versionadas. |
| `show-sql=true` y `format_sql=true` | Muestran SQL formateado para observar las consultas. |
| `open-in-view=false` | No mantiene el contexto JPA abierto durante toda la fase web. Las relaciones necesarias se convierten a DTO dentro de las transacciones de servicio. |
| `server.error.include-message=never` y `include-stacktrace=never` | Limitan detalles del mecanismo de error estándar de Boot. Nuestro handler construye sus propios mensajes JSON. |

Los tests activan el perfil `test`: URL `jdbc:h2:mem:cineclick-test`, `create-drop`, sin consola H2 y sin mostrar SQL. Así no usan el archivo de datos normal. `DB_CLOSE_DELAY=-1` mantiene la base en memoria mientras vive la JVM, aunque temporalmente se cierren sus conexiones.

## 5. Entidades, atributos y relaciones

Todas las entidades usan `Long id` con `@Id` y `@GeneratedValue(strategy = IDENTITY)`. La base genera la clave al insertar. Tienen getters y setters generados por Lombok. Los nombres de tablas están definidos con `@Table`.

### 5.1. Inventario de entidades

| Entidad / tabla | Atributos propios | Relaciones y significado |
| --- | --- | --- |
| `Usuario` / `usuarios` | `id`, `nombre`, `apellido`, `email`, `password`, `rol`, `activo=true`. | Identidad de acceso. Email único. Un usuario administrador puede existir sin perfil de cliente. |
| `Cliente` / `clientes` | `id`, `telefono`, `fechaRegistro`. | `usuario`: uno a uno, obligatorio, FK única `usuario_id`, cascade ALL. Añade datos del comprador. |
| `Pelicula` / `peliculas` | `id`, `titulo`, `sinopsis`, `duracionMinutos`, `clasificacion`, `genero`, `idioma`, `formatosDisponibles`, `urlPoster`, `fechaEstreno`, `activa=true`. | Los formatos forman una colección de enums en `pelicula_formatos`, no una entidad con repository propio. |
| `Cine` / `cines` | `id`, `nombre`, `direccion`, `ciudad`, `telefono`, `activo=true`. | Lista `salas`: uno a muchos. |
| `Sala` / `salas` | `id`, `nombre`, `numero`, `tipo`, `activa=true`. | Pertenece a `cine` y contiene lista `butacas`. Número de sala único dentro de cada cine. La capacidad se calcula, no es un campo persistido independiente. |
| `Butaca` / `butacas` | `id`, `fila`, `numero`, `tipo=NORMAL`, `activa=true`. | Pertenece a `sala`. La combinación sala/fila/número es única. No tiene un booleano global de ocupada. |
| `Funcion` / `funciones` | `id`, `fechaHoraInicio`, `fechaHoraFin`, `precioBase`, `formato`, `idioma`, `estado=PROGRAMADA`. | Pertenece a una `pelicula` y una `sala`. El cine se obtiene a través de la sala. |
| `Compra` / `compras` | `id`, `fechaCompra`, `total=0`, `estado=PENDIENTE_PAGO`. | Tiene `cliente`, `funcion`, lista `entradas`, `promocion` opcional y `pago` opcional. |
| `Entrada` / `entradas` | `id`, `codigoQr`, `precioUnitario`, `estado=EMITIDA`, `vigente=TRUE`. | Pertenece a `compra`, `funcion` y `butaca`. Identifica el asiento adquirido y conserva su precio de venta. |
| `Pago` / `pagos` | `id`, `monto`, `metodoPago`, `estado=PENDIENTE`, `fechaPago`, `codigoTransaccion`. | Tiene una `compra` obligatoria con FK única: como máximo un pago registrado por compra. |
| `Promocion` / `promociones` | `id`, `codigo`, `descripcion`, `porcentajeDescuento`, `fechaInicio`, `fechaFin`, `activa=true`. | Una promoción puede ser referenciada por muchas compras; el código es único. |

Son **11 entidades** y **12 tablas de dominio**, contando `pelicula_formatos`. No confundir las tablas internas del motor con tablas del modelo.

### 5.2. Cardinalidades para dibujar o explicar

```text
Usuario  1 ----- 0..1 Cliente
Cine     1 ----- 0..* Sala
Sala     1 ----- 0..* Butaca
Pelicula 1 ----- 0..* Funcion
Sala     1 ----- 0..* Funcion
Cliente  1 ----- 0..* Compra
Funcion  1 ----- 0..* Compra
Compra   1 ----- 0..* Entrada (el caso de uso exige al menos una)
Funcion  1 ----- 0..* Entrada
Butaca   1 ----- 0..* Entrada (en distintas funciones o histórico cancelado)
Compra   1 ----- 0..1 Pago
Promocion 0..1 -- 0..* Compra
```

Cada compra puede tener cero o una promoción; cada promoción puede aparecer en muchas compras. Cada entrada tiene exactamente una compra, función y butaca. La unicidad limita a una entrada vigente por función/butaca, no a una entrada histórica para toda la vida de la butaca.

### 5.3. Por qué Usuario y Cliente están separados

`Usuario` guarda identidad y acceso; `Cliente` agrega datos comerciales. La relación es composición/asociación uno a uno, **no herencia**: `Cliente` no dice `extends Usuario`. Por eso `cliente.id` y `usuario.id` son claves diferentes. La API de compra pide el ID de cliente, mientras el login devuelve `usuarioId`.

### 5.4. Enums: valores exactos

| Enum | Valores |
| --- | --- |
| `RolUsuario` | `ADMIN`, `CLIENTE`. |
| `EstadoCompra` | `PENDIENTE_PAGO`, `CONFIRMADA`, `CANCELADA`. |
| `EstadoEntrada` | `EMITIDA`, `USADA`, `CANCELADA`. |
| `EstadoPago` | `PENDIENTE`, `APROBADO`, `RECHAZADO`. |
| `EstadoFuncion` | `PROGRAMADA`, `AGOTADA`, `CANCELADA`, `FINALIZADA`. |
| `FormatoFuncion` | `DOS_D`, `TRES_D`, `IMAX`, `CUATRO_D`. |
| `Genero` | `ACCION`, `COMEDIA`, `DRAMA`, `TERROR`, `CIENCIA_FICCION`, `ANIMACION`, `DOCUMENTAL`. |
| `MetodoPago` | `TARJETA_CREDITO`, `TARJETA_DEBITO`, `MERCADO_PAGO`, `EFECTIVO`. |
| `TipoButaca` | `NORMAL`, `VIP`, `DISCAPACIDAD`. |
| `TipoSala` | `TRADICIONAL`, `PREMIUM`, `IMAX`, `CUATRO_D`. |

Se persisten con `EnumType.STRING`. Tener un valor en un enum no garantiza un proceso que lo utilice: por ejemplo, no hay un trabajo automático que marque funciones `FINALIZADA` o `AGOTADA`.

## 6. Métodos de las entidades

Los métodos siguientes son los escritos explícitamente. Los getters/setters generados se explican en la sección 15.

### Usuario

Fuente: [Usuario.java](../src/main/java/com/cineclick/model/Usuario.java).

- `nombreCompleto() -> String`: concatena nombre, un espacio y apellido. No consulta la base.
- `desactivar() -> void`: asigna `activo=false`. No borra la fila ni persiste por sí solo; la operación debe realizarse sobre una entidad gestionada o guardarse después.

### Cliente

Fuente: [Cliente.java](../src/main/java/com/cineclick/model/Cliente.java).

- `prePersist() -> void`: callback `@PrePersist`; antes de insertar asigna la fecha/hora actual si `fechaRegistro` todavía es null. Conserva una fecha ya cargada.
- `nombreCompleto() -> String`: delega en `usuario.nombreCompleto()`.
- `desactivar() -> void`: delega en `usuario.desactivar()`. La marca de activo está en Usuario.

### Pelicula

Fuente: [Pelicula.java](../src/main/java/com/cineclick/model/Pelicula.java).

- `estaDisponible() -> boolean`: devuelve `activa`. No comprueba funciones, estreno ni existencia de entradas.
- `validarDuracion() -> void`: lanza `IllegalArgumentException` si la duración es null o no positiva. **No lo llama el service actual**: `PeliculaService.validarDatos()` tiene su propia validación y usa `ReglaNegocioException`.

### Cine

Fuente: [Cine.java](../src/main/java/com/cineclick/model/Cine.java).

- `agregarSala(Sala sala) -> void`: asigna este cine a la sala y añade la sala a la colección. Mantiene coherentes los dos lados de la relación en memoria.
- `obtenerSalasActivas() -> List<Sala>`: filtra la colección por `Sala.isActiva()`. El mapper del cine no usa este método: actualmente incluye todas las salas de la colección, ordenadas por número.

### Sala

Fuente: [Sala.java](../src/main/java/com/cineclick/model/Sala.java).

- `capacidad() -> Integer`: cuenta las butacas activas. No resta entradas vendidas, porque mide capacidad física habilitada, no disponibilidad para una función.
- `agregarButaca(Butaca butaca) -> void`: asigna la sala a la butaca y añade esta a la lista.

### Butaca

Fuente: [Butaca.java](../src/main/java/com/cineclick/model/Butaca.java).

- `codigo() -> String`: concatena fila y número; por ejemplo, `A` y `1` producen `A1`. No es único entre todas las salas.
- `estaHabilitada() -> boolean`: devuelve `activa`. No comprueba si está ocupada en una función; las compras utilizan `isActiva()` y consultan entradas.

### Funcion

Fuente: [Funcion.java](../src/main/java/com/cineclick/model/Funcion.java).

- `calcularHorarioFin() -> void`: si existen película, inicio y duración, asigna inicio + duración + 20 minutos. Tiene `@PrePersist` y `@PreUpdate`, y también se invoca explícitamente para validar solapamientos. El campo fin incluye el margen entre funciones.
- `estaDisponibleParaVenta() -> boolean`: exige estado `PROGRAMADA` e inicio posterior al momento actual. No comprueba por sí solo si quedan butacas ni si cine, sala o película están activos.
- `cambiarEstado(EstadoFuncion estado) -> void`: asigna el estado recibido. No valida una matriz de transiciones.

### Compra

Fuente: [Compra.java](../src/main/java/com/cineclick/model/Compra.java).

- `prePersist() -> void`: completa `fechaCompra` con el momento actual si era null.
- `agregarEntrada(Entrada entrada) -> void`: asigna la compra y la función de esta compra a la entrada, y la agrega a la lista. Por eso el service fija la función antes de agregar entradas.
- `calcularTotal() -> BigDecimal`: suma `precioUnitario` de las entradas con `reduce`; si existe promoción, calcula el total descontado; guarda y devuelve el resultado. No valida vigencia de promo: eso lo hace el service antes.
- `confirmar() -> void`: cambia el estado a `CONFIRMADA`. Lo utiliza el pago aprobado.
- `cancelar() -> void`: cambia a `CANCELADA` y llama a `cancelar()` en todas sus entradas. No modifica el pago ni devuelve dinero.

### Entrada

Fuente: [Entrada.java](../src/main/java/com/cineclick/model/Entrada.java).

- `generarCodigoQr() -> void`: si falta el código, crea el texto `CINECLICK-` más un UUID. No dibuja un QR, no manda emails y no valida el ingreso a una sala.
- `marcarUsada() -> void`: cambia el estado a `USADA`; mantiene `vigente=TRUE`, por lo que no libera la butaca. No hay endpoint que llame a este método.
- `cancelar() -> void`: cambia el estado a `CANCELADA` y `vigente` a null. Permite conservar el registro y liberar su unicidad activa.

### Pago

Fuente: [Pago.java](../src/main/java/com/cineclick/model/Pago.java).

- `confirmar(String codigoTransaccion) -> void`: cambia a `APROBADO`, guarda el código recibido y asigna la fecha/hora actual.
- `rechazar() -> void`: cambia a `RECHAZADO` y asigna la fecha/hora. No cancela automáticamente la compra.

### Promocion

Fuente: [Promocion.java](../src/main/java/com/cineclick/model/Promocion.java).

- `estaVigente(LocalDate fecha) -> boolean`: exige activa y fecha dentro del intervalo, incluyendo los días de inicio y fin.
- `calcularDescuento(BigDecimal total) -> BigDecimal`: divide el porcentaje por 100 con escala 4, resta esa fracción a 1, multiplica por el total y redondea a 2 decimales con `HALF_UP`. **Devuelve el precio final con descuento**, no el importe ahorrado. Para 1000 y 10%, devuelve 900.

## 7. Controllers: todos los endpoints

Fuentes: paquete [controller](../src/main/java/com/cineclick/controller).

Todos usan `@RestController`, `@RequiredArgsConstructor` y `@CrossOrigin(origins="*")`. Los cuerpos de entrada usan `@RequestBody` y `@Valid`. Los IDs de ruta usan `@PathVariable`; los filtros opcionales, `@RequestParam(required=false)`.

El controller delega en el service y devuelve su resultado. La serialización a JSON la hace la infraestructura. Los métodos de alta indicados con `@ResponseStatus(CREATED)` devuelven 201; los DELETE con `NO_CONTENT`, 204. Las lecturas, actualizaciones y cancelaciones exitosas devuelven 200.

| Controller.método | HTTP y ruta | Delegación y resultado |
| --- | --- | --- |
| `AuthController.login(dto)` | POST `/api/auth/login` | `AuthService.login`; devuelve identidad y rol, 200. |
| `PeliculaController.listar(genero)` | GET `/api/peliculas` | `PeliculaService.listar`; películas activas con filtro opcional de género. |
| `PeliculaController.obtener(id)` | GET `/api/peliculas/{id}` | `buscarPorId`; una película, incluso si fue dada de baja. |
| `PeliculaController.crear(dto)` | POST `/api/peliculas` | `crear`; nueva película, 201. |
| `PeliculaController.actualizar(id,dto)` | PUT `/api/peliculas/{id}` | `actualizar`; datos actualizados, 200. |
| `PeliculaController.eliminar(id)` | DELETE `/api/peliculas/{id}` | `eliminar`; baja lógica, 204. |
| `CineController.listar(ciudad)` | GET `/api/cines` | `CineService.listar`; cines activos y filtro opcional. |
| `CineController.obtener(id)` | GET `/api/cines/{id}` | `buscarPorId`; cine con salas en el DTO. |
| `CineController.crear(dto)` | POST `/api/cines` | `crear`; nuevo cine, 201. |
| `CineController.actualizar(id,dto)` | PUT `/api/cines/{id}` | `actualizar`; datos del cine. |
| `CineController.eliminar(id)` | DELETE `/api/cines/{id}` | `eliminar`; `activo=false`, 204. |
| `CineController.listarSalas(id)` | GET `/api/cines/{id}/salas` | `listarSalas`; salas activas del cine. |
| `CineController.agregarSala(id,dto)` | POST `/api/cines/{id}/salas` | `agregarSala`; sala con butacas generadas, 201. |
| `ClienteController.listar()` | GET `/api/clientes` | `ClienteService.listar`; todos los clientes, sin filtro de activos. |
| `ClienteController.registrar(dto)` | POST `/api/clientes` | `registrar`; usuario y perfil de cliente, 201. |
| `ClienteController.obtener(id)` | GET `/api/clientes/{id}` | `buscarPorId`; perfil de cliente. |
| `ClienteController.actualizar(id,dto)` | PUT `/api/clientes/{id}` | `actualizar`; datos de perfil y acceso. |
| `ClienteController.eliminar(id)` | DELETE `/api/clientes/{id}` | `eliminar`; desactiva su usuario, 204. |
| `ClienteController.listarCompras(id)` | GET `/api/clientes/{id}/compras` | `CompraService.listarPorCliente`; historial del ID indicado. |
| `FuncionController.listar(...)` | GET `/api/funciones` | `FuncionService.listar`; filtros `peliculaId`, `cineId`, `ciudad`, `fecha`, `formato`. |
| `FuncionController.obtener(id)` | GET `/api/funciones/{id}` | `buscarPorId`; una función. |
| `FuncionController.crear(dto)` | POST `/api/funciones` | `crear`; programa una función, 201. |
| `FuncionController.actualizar(id,dto)` | PUT `/api/funciones/{id}` | `actualizar`; modifica programación y precio. |
| `FuncionController.eliminar(id)` | DELETE `/api/funciones/{id}` | `eliminar`; cambia a `CANCELADA`, 204. |
| `FuncionController.obtenerButacasDisponibles(id)` | GET `/api/funciones/{id}/butacas-disponibles` | Lista butacas activas de la sala, cada una con `disponible=true/false`. |
| `CompraController.crear(dto)` | POST `/api/compras` | `CompraService.crearCompra`; compra pendiente y entradas, 201. |
| `CompraController.obtener(id)` | GET `/api/compras/{id}` | `buscarPorId`; compra, entradas y pago si existe. |
| `CompraController.cancelar(id)` | PATCH `/api/compras/{id}/cancelar` | `cancelar`; modifica estado y libera butacas, 200. |
| `PagoController.registrarPago(compraId,dto)` | POST `/api/compras/{compraId}/pagos` | `PagoService.registrarPago`; registra pago simulado, 201 incluso si queda rechazado. |
| `PagoController.obtener(id)` | GET `/api/pagos/{id}` | `buscarPorId`; consulta el pago. |
| `PromocionController.listarActivas()` | GET `/api/promociones` | `PromocionService.listarActivas`; activas, no necesariamente vigentes hoy. |
| `PromocionController.crear(dto)` | POST `/api/promociones` | `crear`; nueva promoción, 201. |

Son **32 endpoints**. No existe CRUD HTTP completo independiente para cada entidad: las salas se crean/listan desde cine; las butacas nacen con la sala; las entradas nacen con la compra; promociones solo tienen alta y listado. Es incorrecto decir que toda clase tiene controller propio.

`PUT` recibe el DTO completo de actualización. `PATCH` se utiliza para la acción parcial de cancelar una compra. `DELETE` expresa la baja en el contrato HTTP aunque internamente se ejecute un UPDATE SQL.

## 8. Services: método por método

En los métodos anotados `@Transactional`, Spring coordina la transacción cuando la llamada pasa por el bean administrado. `readOnly=true` expresa una operación de lectura. Los métodos privados auxiliares no son endpoints ni se convierten automáticamente en transacciones independientes.

### 8.1. AuthService

Fuente: [AuthService.java](../src/main/java/com/cineclick/service/AuthService.java).

`login(LoginRequestDTO dto) -> LoginResponseDTO`: busca usuario por email ignorando mayúsculas. Si no existe, está inactivo o no coincide la contraseña, lanza `CredencialesInvalidasException` (401). Si coincide, devuelve ID de usuario, nombre completo, email, rol y mensaje. Se ejecuta como lectura. Compara contraseña directamente con `equals`, no con un hash. No crea sesión, cookie ni token de acceso.

### 8.2. PeliculaService

Fuente: [PeliculaService.java](../src/main/java/com/cineclick/service/PeliculaService.java).

| Método | Comportamiento |
| --- | --- |
| `listar(Genero genero)` | Si no hay género, busca activas; si lo hay, busca activas de ese género. Mapea a `List<PeliculaResponseDTO>`. |
| `buscarPorId(Long id)` | Reutiliza `buscarEntidad` y convierte la entidad a DTO. |
| `crear(PeliculaRequestDTO dto)` | Crea entidad, copia campos, valida duración/formatos, guarda y mapea. |
| `actualizar(Long id, PeliculaRequestDTO dto)` | Obtiene entidad o 404, reemplaza campos editables, valida, guarda y mapea. No cambia `activa`. |
| `eliminar(Long id)` | Busca la película, marca `activa=false` y guarda. No cancela sus funciones. |
| `buscarEntidad(Long id)` | Devuelve `Pelicula` mediante `findById`; si falta, 404 con ID en el mensaje. No filtra inactivas. |
| `validarDatos(Pelicula pelicula)` | Exige duración mayor que cero y al menos un formato; ante incumplimiento lanza regla de negocio (400). |
| `copiarDatos(dto,pelicula)` | Helper privado: asigna título, sinopsis, duración, clasificación, género, idioma, formatos, URL y estreno. No copia ID ni estado activo. |

### 8.3. CineService

Fuente: [CineService.java](../src/main/java/com/cineclick/service/CineService.java).

| Método | Comportamiento |
| --- | --- |
| `listar(String ciudad)` | Null/blanco: todos los cines activos. Con ciudad: activos de esa ciudad, ignorando mayúsculas. No aplica búsqueda parcial ni elimina espacios del texto no vacío. |
| `buscarPorId(Long id)` | Busca entidad y convierte a DTO con sus salas. |
| `crear(CineRequestDTO dto)` | Construye cine, copia datos básicos, guarda y mapea. |
| `actualizar(Long id,CineRequestDTO dto)` | Modifica nombre, dirección, ciudad y teléfono del existente. |
| `eliminar(Long id)` | Marca cine inactivo. No desactiva automáticamente sus salas ni funciones. |
| `agregarSala(Long cineId,SalaRequestDTO dto)` | Rechaza más de 26 filas; busca cine; crea sala; genera todas las butacas; vincula sala a cine; guarda por cascade y devuelve DTO. Los números 1 y 2 de cada fila son VIP. El DTO ya exige valores positivos. |
| `listarSalas(Long cineId)` | Primero verifica que el cine exista; después busca salas activas por su ID y las mapea. |
| `buscarEntidad(Long id)` | Devuelve cine o lanza 404. No verifica `activo`. |
| `copiarDatos(dto,cine)` | Helper privado que asigna los cuatro datos editables del cine. |

La unicidad del número de sala dentro del cine la garantiza la base; no hay una comprobación previa específica en `agregarSala`. La capacidad resultante es filas multiplicadas por butacas por fila, mientras todas estén activas.

### 8.4. ClienteService

Fuente: [ClienteService.java](../src/main/java/com/cineclick/service/ClienteService.java).

| Método | Comportamiento |
| --- | --- |
| `listar()` | Usa `findAll()` y convierte todos los clientes, incluidos los desactivados. |
| `registrar(ClienteRequestDTO dto)` | Comprueba email único; crea Usuario con rol CLIENTE y datos de acceso; crea Cliente, lo vincula y guarda. Cascade persiste ambos. Devuelve DTO sin contraseña. |
| `buscarPorId(Long id)` | Busca cliente y lo mapea. |
| `actualizar(Long id,ClienteRequestDTO dto)` | Busca cliente. Si el email cambia sin considerar mayúsculas, verifica unicidad. Cambia nombre, apellido, email, contraseña y teléfono; guarda. No modifica rol ni activo. |
| `eliminar(Long id)` | Llama a `cliente.desactivar()`, que modifica el Usuario; guarda. El historial permanece. |
| `buscarEntidad(Long id)` | Retorna Cliente o 404. No comprueba que el usuario esté activo. |
| `validarEmailUnico(String email)` | Consulta `existsByEmailIgnoreCase`; si existe, lanza `RecursoDuplicadoException` (409). |

La validación previa de email mejora el error, pero las carreras entre registros requieren considerar también la base. Un `unique` de texto normal no garantiza por sí mismo unicidad sin distinguir mayúsculas para todas las configuraciones de motor.

### 8.5. FuncionService

Fuente: [FuncionService.java](../src/main/java/com/cineclick/service/FuncionService.java).

| Método | Comportamiento |
| --- | --- |
| `listar(peliculaId,cineId,ciudad,fecha,formato)` | Normaliza ciudad vacía a null. Si hay fecha, crea intervalo desde ese día a las 00:00 hasta el siguiente a las 00:00. Ejecuta `buscarConFiltros` y mapea. No filtra implícitamente estado ni funciones pasadas. |
| `buscarPorId(Long id)` | Busca entidad y devuelve DTO. |
| `crear(FuncionRequestDTO dto)` | Crea función, resuelve película/sala y copia datos; valida horario sin ID ignorado; guarda. |
| `actualizar(Long id,FuncionRequestDTO dto)` | Obtiene función, reemplaza datos, valida excluyendo esa misma función del control de solapamientos, guarda. No cambia su estado. |
| `eliminar(Long id)` | Cambia estado a `CANCELADA`; no cancela las compras asociadas. |
| `obtenerButacasDisponibles(Long funcionId)` | Obtiene entradas de la función que no están canceladas, reúne sus IDs de butaca en un Set y recorre las butacas activas de la sala. Devuelve todas ellas con una bandera de disponibilidad. |
| `buscarEntidad(Long id)` | Devuelve función o 404. |
| `validarHorario(Funcion funcion,Long idIgnorado)` | Comprueba formato soportado por la película, calcula fin, rechaza inicio pasado y busca cruce con funciones no canceladas de la misma sala, ignorando el ID editado. |
| `copiarDatos(dto,funcion)` | Helper privado: obtiene película y sala por ID o lanza 404; asigna ambas, inicio, precio, formato e idioma. |

La condición de cruce de intervalos es:

```text
inicioNueva < finExistente AND finNueva > inicioExistente
```

Ejemplo: película de 100 minutos a las 18:00 -> fin de bloque 20:00 con margen incluido. Otra función a las 19:50 se rechaza; una a las 20:00 no se superpone. Al actualizar, `idIgnorado` evita comparar una función consigo misma.

El control verifica formatos de la película, pero no compatibilidad técnica entre formato y tipo de sala. El control de solapamiento se hace sobre datos consultados; no tiene un bloqueo dedicado que elimine carreras entre altas simultáneas.

### 8.6. CompraService

Fuente: [CompraService.java](../src/main/java/com/cineclick/service/CompraService.java).

Depende de `CompraRepository`, `EntradaRepository`, `ButacaRepository`, `ClienteService`, `FuncionService` y `PromocionService`. Es el coordinador del caso principal.

**`crearCompra(CompraRequestDTO dto) -> CompraResponseDTO`**, transaccional:

1. Rechaza IDs de butaca repetidos.
2. Obtiene cliente y función o produce 404.
3. Exige función programada y futura.
4. Busca todas las butacas solicitadas.
5. Valida cantidad encontrada, actividad, pertenencia a sala y ausencia de entrada no cancelada.
6. Crea compra y asigna cliente y función.
7. Si viene código de promoción no vacío, busca y valida vigencia; lo asocia.
8. Por cada butaca crea una Entrada, calcula su precio y genera un código textual UUID.
9. `compra.agregarEntrada()` completa los vínculos de la entrada.
10. `compra.calcularTotal()` suma y aplica descuento.
11. `saveAndFlush()` guarda la compra y sus entradas por cascade, sincronizando con la base.
12. Mapea a DTO. Si se produce `DataIntegrityViolationException` dentro de ese bloque, lanza `ButacaNoDisponibleException`, que será 409 y causará rollback.

No recibe el precio ni el total desde el cliente: se calculan con los datos del servidor. La compra nace pendiente, pero sus entradas ya ocupan las butacas.

| Otro método | Comportamiento |
| --- | --- |
| `buscarPorId(Long id)` | Busca compra y la mapea, incluyendo entradas y pago si existe. |
| `listarPorCliente(Long clienteId)` | Verifica existencia del cliente; busca todas sus compras por ID; mapea. No exige que quien consulta sea ese cliente. |
| `cancelar(Long id)` | Busca compra; si ya está cancelada, lanza 400. Si no, llama a `Compra.cancelar()`, guarda y devuelve DTO. También permite cancelar una confirmada, sin reintegro. |
| `buscarEntidad(Long id)` | Retorna compra o 404. |
| `validarButacasDisponibles(funcion,butacas,idsSolicitados)` | Cantidad distinta: 404. Butaca inactiva: 409. Sala incorrecta: 400. Entrada no cancelada para esa butaca/función: 409. Es una validación previa, no el mecanismo final de exclusión concurrente. |
| `validarButacasSinDuplicados(List<Long> butacasIds)` | Helper privado: crea `HashSet`; si su tamaño difiere del tamaño original, lanza 400. |
| `calcularPrecioButaca(BigDecimal precioBase,Butaca butaca)` | Helper privado: VIP multiplica por 1.30, DISCAPACIDAD por 0.80 y NORMAL conserva base. Redondea a 2 decimales `HALF_UP`. |

El catch actual traduce cualquier violación de integridad que ocurra dentro del bloque de guardado a un problema de butacas. No inspecciona el nombre de la restricción fallida.

### 8.7. PagoService

Fuente: [PagoService.java](../src/main/java/com/cineclick/service/PagoService.java).

`registrarPago(Long compraId,PagoRequestDTO dto) -> PagoResponseDTO`, transaccional:

1. Busca compra o lanza 404.
2. Rechaza compra cancelada con 400.
3. Rechaza cualquier pago previo asociado, incluso rechazado, con 400.
4. Crea Pago, toma el monto del total de compra y copia el método solicitado.
5. Si el token contiene `rechazar`, marca pago rechazado.
6. En otro caso genera `TX-` + UUID, aprueba el pago y confirma la compra.
7. Asigna el pago a la compra, guarda el pago y devuelve DTO.

No llama a Mercado Pago ni a un banco. Un token null también entra en la rama aprobada. El método de pago es un dato del registro, no un adaptador a un proveedor real.

- `buscarPorId(Long id) -> PagoResponseDTO`: lee el pago o lanza 404 y lo convierte.
- `debeRechazarse(String token) -> boolean`: helper privado; si token no es null, pasa a minúsculas con `Locale.ROOT` y busca la subcadena `rechazar`.

`compra.confirmar()` se persiste por seguimiento de cambios de JPA sobre una entidad gestionada en la transacción, aunque no haya un `compraRepository.save()` explícito en este método.

### 8.8. PromocionService

Fuente: [PromocionService.java](../src/main/java/com/cineclick/service/PromocionService.java).

| Método | Comportamiento |
| --- | --- |
| `listarActivas()` | Busca `activa=true` y mapea. No filtra fecha. |
| `crear(PromocionRequestDTO dto)` | Verifica orden de fechas, construye entidad, copia datos, guarda y mapea. Porcentaje y campos requeridos se validan en el DTO. |
| `buscarPorCodigo(String codigo)` | Busca sin distinguir mayúsculas y devuelve entidad o 404. |
| `validarPromocionParaCompra(String codigo)` | Busca por código y verifica `estaVigente(LocalDate.now())`; si no cumple, 400. Evalúa el día de compra, no el día de la función. |
| `copiarDatos(dto,promocion)` | Helper privado: copia código, descripción, porcentaje, fechas y flag activa. |
| `validarFechas(LocalDate inicio,LocalDate fin)` | Helper privado: rechaza fin anterior al inicio. Un único día con fechas iguales es válido. |

El flag `activa` del DTO es un boolean primitivo: si se omite en el JSON, su valor de entrada habitual es false. `copiarDatos` reemplaza con él el valor inicial true de la entidad.

## 9. Repositories y consultas

Fuentes: paquete [repository](../src/main/java/com/cineclick/repository).

Todos son interfaces `extends JpaRepository<Entidad, Long>`. El primer parámetro genérico identifica el tipo de entidad y el segundo, el tipo de su clave primaria. Spring Data construye implementaciones administradas por Spring; no hace falta escribir una clase `...RepositoryImpl` para estos métodos.

### 9.1. Métodos heredados usados o relevantes

| Método | Significado |
| --- | --- |
| `findById(id)` | Busca por clave primaria. Retorna `Optional<Entidad>` para representar presencia o ausencia. |
| `findAll()` | Obtiene todas las entidades del tipo, sin filtro automático por activo. |
| `findAllById(ids)` | Obtiene las entidades existentes entre esos IDs. No garantiza devolver un elemento por ID inexistente ni preservar el orden pedido. |
| `save(entidad)` | Persiste una nueva entidad o combina el estado de una existente según su condición. No implica commit inmediato. |
| `saveAndFlush(entidad)` | Guarda y fuerza la sincronización de cambios con la base. Sigue sin ser lo mismo que commit. |
| `count()` | Cuenta filas; el seeder lo usa para decidir si cargar datos. |
| `deleteById(id)` | Existe por herencia, pero los services de baja del proyecto no lo usan: modifican el estado. |

### 9.2. Todos los métodos declarados

| Repository | Método | Qué consulta |
| --- | --- | --- |
| `UsuarioRepository` | `findByEmailIgnoreCase(String email)` | Usuario por email sin distinguir mayúsculas, como Optional. |
| `UsuarioRepository` | `existsByEmailIgnoreCase(String email)` | Booleano que indica si el email ya está registrado. |
| `ClienteRepository` | `findByUsuarioEmailIgnoreCase(String email)` | Recorre Cliente.usuario.email y busca el perfil. Declarado, sin uso en los services actuales. |
| `PeliculaRepository` | `findByActivaTrue()` | Películas activas. |
| `PeliculaRepository` | `findByGeneroAndActivaTrue(Genero genero)` | Películas activas del género indicado. |
| `CineRepository` | `findByActivoTrue()` | Cines activos. |
| `CineRepository` | `findByCiudadIgnoreCaseAndActivoTrue(String ciudad)` | Cines activos de una ciudad, comparación sin distinguir mayúsculas. |
| `SalaRepository` | `findByCineIdAndActivaTrue(Long cineId)` | Salas activas de un cine. |
| `ButacaRepository` | `findBySalaIdAndActivaTrue(Long salaId)` | Butacas habilitadas de una sala, independientemente de sus ventas. |
| `FuncionRepository` | `findByPeliculaId(Long peliculaId)` | Funciones de una película. Declarado, no usado por el listado actual. |
| `FuncionRepository` | `findBySalaId(Long salaId)` | Funciones de una sala; se utiliza para detectar cruces de horario. |
| `FuncionRepository` | `findByFechaHoraInicioBetween(LocalDateTime desde,LocalDateTime hasta)` | Funciones con inicio dentro del intervalo inclusivo BETWEEN. Declarado, no usado por el listado actual. |
| `FuncionRepository` | `buscarConFiltros(peliculaId,cineId,ciudad,formato,desde,hasta)` | Consulta anotada con filtros opcionales, relaciones cargadas y orden cronológico. |
| `CompraRepository` | `findByClienteId(Long clienteId)` | Compras del perfil de cliente, sin excluir canceladas. |
| `EntradaRepository` | `findByFuncionId(Long funcionId)` | Todas las entradas de esa función; el service luego descarta canceladas para disponibilidad. |
| `EntradaRepository` | `findByCompraId(Long compraId)` | Entradas de una compra. Declarado, no usado por los services actuales. |
| `EntradaRepository` | `existsByFuncionIdAndButacaIdAndEstadoNot(Long funcionId,Long butacaId,EstadoEntrada estado)` | Si existe entrada de esa función/asiento cuyo estado sea diferente al indicado. Se pasa `CANCELADA` para comprobar ocupación. |
| `PagoRepository` | `findByCompraId(Long compraId)` | Pago de la compra como Optional; detecta pagos previos. |
| `PromocionRepository` | `findByCodigoIgnoreCase(String codigo)` | Promoción por código sin distinguir mayúsculas. |
| `PromocionRepository` | `findByActivaTrue()` | Promociones activas; no analiza vigencia temporal. |

En los métodos derivados, Spring interpreta palabras como `By`, `And`, `IgnoreCase`, `True` y `Not`, y navega propiedades de entidades. `findByCineIdAndActivaTrue` utiliza `sala.cine.id`, no exige un atributo `cineId` separado en Sala.

### 9.3. Consulta de funciones, explicada

`buscarConFiltros` usa `@Query` con JPQL/HQL: se escribe sobre `Funcion`, `f.pelicula`, `f.sala` y `s.cine`, que son entidades y propiedades Java. No es una consulta SQL nativa sobre nombres de tablas.

- `join fetch f.pelicula`, `join fetch f.sala` y `join fetch s.cine` cargan esas relaciones en la consulta principal.
- La condición `:peliculaId is null or p.id = :peliculaId` desactiva el filtro cuando no se envía.
- `lower(c.ciudad) = lower(:ciudad)` compara sin distinguir mayúsculas.
- `@Param` asocia el argumento Java al parámetro nombrado de consulta.
- Inicio `>= desde` y `< hasta` cubre un día completo sin incluir medianoche del día siguiente.
- Los `cast(... as localdatetime)` ayudan a tipar los parámetros temporales de esta consulta Hibernate.
- `order by f.fechaHoraInicio` ordena de más temprano a más tarde.

El `join fetch` reduce el problema N+1 para estas relaciones: evita resolver película, sala y cine con consultas adicionales al recorrer cada función. No significa que todas las consultas del proyecto estén optimizadas ni que nunca aparezcan consultas extras por otras colecciones.

## 10. DTOs y conversión

Fuentes: paquete [dto](../src/main/java/com/cineclick/dto), especialmente [DtoMapper.java](../src/main/java/com/cineclick/dto/DtoMapper.java).

### 10.1. Por qué hay Request y Response diferentes

El request define lo que puede enviar el consumidor; el response define lo que necesita recibir. La compra recibe IDs y código de promoción, pero devuelve importe, estado, entradas y pago. La contraseña entra en `ClienteRequestDTO`, pero no aparece en `ClienteResponseDTO` ni en `LoginResponseDTO`.

Los DTOs son records. Un `record` genera constructor canónico, accesores del estilo `dto.email()`, `equals`, `hashCode` y `toString`. Sus referencias de componentes son finales, pero una lista contenida puede seguir siendo mutable si no se copia: la inmutabilidad es superficial. El mapper de película sí hace `Set.copyOf(...)`.

### 10.2. Todos los DTOs de entrada y sus reglas

| DTO | Campos y validación |
| --- | --- |
| `LoginRequestDTO` | `email`: obligatorio y formato email; `password`: no blanco. |
| `ClienteRequestDTO` | `nombre` y `apellido`: no blancos, hasta 80; `email`: no blanco, email, hasta 120; `password`: no blanco, 4 a 120; `telefono`: opcional, hasta 40. |
| `PeliculaRequestDTO` | `titulo`: no blanco, hasta 120; `sinopsis`: no blanco, hasta 1200; `duracionMinutos`: no null, mínimo 1; `clasificacion`: no blanco, hasta 20; `genero`: no null; `idioma`: no blanco, hasta 40; `formatosDisponibles`: no vacío; `urlPoster`: hasta 500; `fechaEstreno`: opcional. |
| `CineRequestDTO` | `nombre`: no blanco, hasta 120; `direccion`: no blanco, hasta 160; `ciudad`: no blanco, hasta 80; `telefono`: opcional, hasta 40. |
| `SalaRequestDTO` | `nombre`: no blanco, hasta 80; `numero`, `cantidadFilas`, `butacasPorFila`: no null, mínimo 1; `tipo`: no null. El máximo de 26 filas lo controla el service. |
| `FuncionRequestDTO` | `peliculaId`, `salaId`: no null; `fechaHoraInicio`: no null y futura; `precioBase`: no null, mínimo 0.01; `formato`: no null; `idioma`: no blanco, hasta 40. |
| `CompraRequestDTO` | `clienteId`, `funcionId`: no null; `butacasIds`: no vacío; `codigoPromocion`: opcional. No declara `@NotNull` para cada elemento individual de la lista. |
| `PagoRequestDTO` | `metodoPago`: no null; `datosPagoToken`: opcional y usado únicamente por la simulación. |
| `PromocionRequestDTO` | `codigo`: no blanco, hasta 40; `descripcion`: no blanco, hasta 200; `porcentajeDescuento`: no null, entre 0.01 y 100; `fechaInicio`, `fechaFin`: no null; `activa`: boolean. |

`@Size` en teléfono o URL no obliga a enviarlos. `@NotNull` en un ID no prueba que exista en la base. `@Email` valida forma, no existencia del buzón. La URL del póster tiene límite de longitud, no verificación de descarga o de contenido.

### 10.3. Todos los DTOs de respuesta

| DTO | Datos que devuelve |
| --- | --- |
| `LoginResponseDTO` | `usuarioId`, `nombreCompleto`, `email`, `rol`, `mensaje`. |
| `ClienteResponseDTO` | `id`, `usuarioId`, `nombre`, `apellido`, `email`, `telefono`, `fechaRegistro`, `activo`. |
| `PeliculaResponseDTO` | `id`, `titulo`, `sinopsis`, `duracionMinutos`, `clasificacion`, `genero`, `idioma`, `formatosDisponibles`, `urlPoster`, `fechaEstreno`, `activa`. |
| `CineResponseDTO` | `id`, `nombre`, `direccion`, `ciudad`, `telefono`, `activo`, `salas`. |
| `SalaResponseDTO` | `id`, `nombre`, `numero`, `tipo`, `activa`, `capacidad`. |
| `ButacaResponseDTO` | `id`, `fila`, `numero`, `codigo`, `tipo`, `disponible`. |
| `FuncionResponseDTO` | `id`, IDs y nombres de película/cine/sala, inicio, fin, precio base, formato, idioma y estado. |
| `CompraResponseDTO` | `id`, `clienteId`, `clienteNombre`, `funcionId`, `peliculaTitulo`, `fechaCompra`, `total`, `estado`, `entradas`, `pago`. |
| `EntradaResponseDTO` | `id`, `codigoQr`, `fila`, `numeroButaca`, `codigoButaca`, `precioUnitario`, `estado`. |
| `PagoResponseDTO` | `id`, `monto`, `metodoPago`, `estado`, `fechaPago`, `codigoTransaccion`. |
| `PromocionResponseDTO` | `id`, `codigo`, `descripcion`, `porcentajeDescuento`, `fechaInicio`, `fechaFin`, `activa`. |
| `ErrorResponseDTO` | `timestamp`, `status`, `error`, `mensaje`, `path`, `detalles`. |

### 10.4. Cada método de DtoMapper

Es `final`, tiene constructor privado y métodos estáticos. No se instancia ni se inyecta como bean. No guarda nada ni abre transacciones.

| Método | Transformación |
| --- | --- |
| `DtoMapper()` | Constructor privado que impide crear instancias desde fuera. |
| `toPeliculaResponse(Pelicula)` | Copia campos públicos de la película y copia el Set de formatos. |
| `toCineResponse(Cine)` | Copia datos del cine; ordena salas por número y las convierte. No filtra salas inactivas. |
| `toSalaResponse(Sala)` | Copia datos y obtiene capacidad con `sala.capacidad()`. Puede requerir cargar sus butacas. |
| `toButacaResponse(Butaca,boolean disponible)` | Copia datos del asiento y utiliza la disponibilidad calculada por el service. |
| `toFuncionResponse(Funcion)` | Extrae IDs y nombres navegando película, sala y cine, además de los datos de programación. |
| `toClienteResponse(Cliente)` | Combina perfil y Usuario. Omite password. |
| `toCompraResponse(Compra)` | Combina compra, cliente, función y película; convierte entradas y, si existe, el pago. |
| `toEntradaResponse(Entrada)` | Copia precio, estado y código, e incorpora fila/número desde Butaca. |
| `toPagoResponse(Pago)` | Copia importe, método, estado, fecha y código de transacción. |
| `toPromocionResponse(Promocion)` | Copia código, descripción, porcentaje, fechas y actividad. |

No existen métodos mapper para login ni errores: esos DTOs se construyen directamente en AuthService y GlobalExceptionHandler.

## 11. Validaciones y errores

### 11.1. Tres niveles de control

1. **Entrada HTTP:** JSON válido, tipos correctos y Bean Validation sobre DTOs. Ejemplo: nombre vacío -> 400 antes de llamar al service.
2. **Negocio:** necesita contexto. Ejemplo: una butaca existe, pero pertenece a otra sala -> 400 desde CompraService.
3. **Base de datos:** integridad incluso si dos solicitudes compiten. Ejemplo: dos entradas vigentes para la misma función/butaca -> restricción única.

No se reemplazan entre sí. Que `@NotNull` permita un ID no significa que el objeto exista; que una consulta vea un asiento libre no significa que siga libre cuando se intenta insertar.

### 11.2. Excepciones propias: constructores y jerarquía

```text
RuntimeException
  RecursoNoEncontradoException
  ReglaNegocioException
    ButacaNoDisponibleException
    CredencialesInvalidasException
    RecursoDuplicadoException
```

Cada una tiene un constructor `(String mensaje)` que llama a `super(mensaje)`. No persisten datos ni producen HTTP por sí mismas. Son excepciones no chequeadas; Spring revierte por defecto la transacción cuando una RuntimeException sale del límite transaccional.

El handler elige la coincidencia más específica: una `ButacaNoDisponibleException` se resuelve como 409, aunque también sea una `ReglaNegocioException` y exista un handler general de 400.

### 11.3. Todos los métodos de GlobalExceptionHandler

Fuente: [GlobalExceptionHandler.java](../src/main/java/com/cineclick/exception/GlobalExceptionHandler.java).

| Método | Excepción / situación | Respuesta |
| --- | --- | --- |
| `manejarNotFound(ex,request)` | RecursoNoEncontradoException. | 404 y mensaje específico. |
| `manejarButacaNoDisponible(ex,request)` | ButacaNoDisponibleException. | 409 y explicación del conflicto. |
| `manejarDuplicado(ex,request)` | RecursoDuplicadoException. | 409, por ejemplo email registrado. |
| `manejarCredenciales(ex,request)` | CredencialesInvalidasException. | 401. |
| `manejarReglaNegocio(ex,request)` | ReglaNegocioException. | 400 y mensaje de la regla incumplida. |
| `manejarValidacion(ex,request)` | MethodArgumentNotValidException por `@Valid`. | 400, mensaje general y lista `campo: motivo`. |
| `manejarJsonInvalido(ex,request)` | HttpMessageNotReadableException. | 400 para JSON mal formado o valor no convertible del body. |
| `manejarTipoInvalido(ex,request)` | MethodArgumentTypeMismatchException. | 400 con nombre y valor del parámetro, por ejemplo ID `abc`. |
| `manejarParametroFaltante(ex,request)` | MissingServletRequestParameterException. | 400 indicando parámetro requerido faltante. Los filtros actuales son opcionales. |
| `manejarRutaInexistente(ex,request)` | NoResourceFoundException. | 404 con mensaje de endpoint inexistente. |
| `manejarMetodoNoPermitido(ex,request)` | HttpRequestMethodNotSupportedException. | 405 e indicación del verbo no permitido. |
| `manejarContentType(ex,request)` | HttpMediaTypeNotSupportedException. | 415 indicando que se espera JSON. |
| `manejarIntegridad(ex,request)` | DataIntegrityViolationException no traducida por un service. | 409 con mensaje genérico de dato existente o en uso. |
| `manejarGeneral(ex,request)` | Otra Exception que llega al handler. | 500 con mensaje genérico; no envía stack trace. |
| `construirRespuesta(status,mensaje,path,detalles)` | Helper privado compartido. | Crea ErrorResponseDTO con fecha actual, código, descripción HTTP y detalles, y lo envuelve en ResponseEntity. |

`HttpServletRequest.getRequestURI()` obtiene la ruta para el error. `ResponseEntity` permite definir estado y body juntos. El handler no registra explícitamente la excepción en un logger; que no se exponga al cliente no equivale a tener observabilidad completa.

Ejemplo ilustrativo del contrato:

```json
{
  "timestamp": "2026-09-30T12:00:00",
  "status": 409,
  "error": "Conflict",
  "mensaje": "La butaca A1 ya no esta disponible",
  "path": "/api/compras",
  "detalles": []
}
```

## 12. Una compra de principio a fin

Esta es la explicación más útil para conectar arquitectura y código. Los IDs de abajo son ilustrativos: deben obtenerse de la API real.

### 12.1. Petición

```http
POST /api/compras
Content-Type: application/json

{
  "clienteId": 1,
  "funcionId": 2,
  "butacasIds": [1, 2],
  "codigoPromocion": "ESTRENO10"
}
```

Jackson convierte el JSON en `CompraRequestDTO`. `@Valid` comprueba IDs no nulos y lista no vacía. El cliente no decide cuánto pagar: no hay un campo total en el request.

### 12.2. Recorrido por las capas

```text
CompraController.crear(dto)
  CompraService.crearCompra(dto) [transacción]
    validarButacasSinDuplicados(ids)
    ClienteService.buscarEntidad(clienteId) -> ClienteRepository.findById
    FuncionService.buscarEntidad(funcionId) -> FuncionRepository.findById
    Funcion.estaDisponibleParaVenta()
    ButacaRepository.findAllById(ids)
    validarButacasDisponibles(...)
      EntradaRepository.existsByFuncionIdAndButacaIdAndEstadoNot(...)
    PromocionService.validarPromocionParaCompra(codigo)
      PromocionRepository.findByCodigoIgnoreCase(codigo)
      Promocion.estaVigente(hoy)
    por cada butaca:
      calcularPrecioButaca(...)
      Entrada.generarCodigoQr()
      Compra.agregarEntrada(...)
    Compra.calcularTotal()
      Promocion.calcularDescuento(subtotal)
    CompraRepository.saveAndFlush(compra)
      Hibernate -> INSERT de compra/entradas -> H2 y restricciones
    DtoMapper.toCompraResponse(compra)
  commit al completar correctamente el límite transaccional
JSON de respuesta y HTTP 201
```

Si falla una validación, el flujo se interrumpe con una excepción. Si falla una inserción, la transacción revierte el conjunto: no debería quedar una compra parcial por una butaca que no pudo guardarse.

### 12.3. Ejemplo numérico exacto

Precio base de Intensamente 2 en la demo: 4200. A1 y A2 son VIP.

```text
Precio por VIP: 4200.00 x 1.30 = 5460.00
Subtotal de dos entradas: 5460.00 + 5460.00 = 10920.00
Promoción 10%: 10920.00 x 0.90 = 9828.00
Total de compra: 9828.00
```

Una sola VIP con esa promoción cuesta 4914.00. Los precios unitarios se conservan antes del descuento general; el DTO de compra devuelve total descontado. El importe del pago se toma de ese total guardado.

`BigDecimal` evita los errores de representación binaria propios de `double` al calcular importes. `HALF_UP` redondea mitades hacia arriba para importes positivos. `precision=12, scale=2` describe hasta 12 dígitos totales, de los cuales 2 son decimales, en la columna monetaria.

### 12.4. Qué ocurre al pagar

```http
POST /api/compras/1/pagos
Content-Type: application/json

{"metodoPago":"MERCADO_PAGO","datosPagoToken":"token-demo"}
```

El pago queda `APROBADO`, se genera un código textual `TX-...` y la compra pasa a `CONFIRMADA`. Las entradas siguen `EMITIDA`: ya habían sido creadas al comprar.

Con `"datosPagoToken":"rechazar"`, el pago queda `RECHAZADO`; se devuelve 201 porque el registro de pago se creó correctamente, aunque su resultado comercial sea rechazo. La compra sigue pendiente y sus butacas siguen ocupadas. No hay reintento sobre la misma compra porque ya tiene un pago.

### 12.5. Qué ocurre al cancelar

`PATCH /api/compras/1/cancelar` llama al service, que llama al dominio. Compra pasa a cancelada; cada entrada pasa a cancelada y su flag vigente a null. Con ello se puede comprar otra vez la misma butaca para esa función. Los registros anteriores permanecen como historial.

Cancelar no borra físicamente, no crea una devolución y no cambia el estado de un pago aprobado. Una segunda cancelación responde 400 en la implementación actual.

## 13. Transacciones y concurrencia

### 13.1. Qué garantiza una transacción

Una transacción agrupa escrituras como una unidad. Para la compra, queremos guardar compra y entradas juntas. Si falla parte del proceso, se revierte el conjunto. Es la atomicidad.

ACID ayuda a explicarlo: **atomicidad** (todo o nada), **consistencia** (restricciones preservadas), **aislamiento** (reglas de interacción entre transacciones) y **durabilidad** (los cambios confirmados persisten según las garantías del motor). Anotar un método con `@Transactional` no equivale a serializar automáticamente todas las compras ni a eliminar cualquier carrera.

La propagación habitual `REQUIRED` permite que los services participantes se incorporen a la transacción abierta de la compra. Que un método auxiliar tenga `readOnly=true` no crea necesariamente otra transacción separada si participa de una ya existente de escritura.

En el funcionamiento por proxies de Spring, una llamada de un objeto a otro bean puede ser interceptada. Una llamada interna `this.metodo()` no pasa por un nuevo proxy. En este código, los métodos externos transaccionales cubren sus helpers; no hay que afirmar que cada llamada abre una transacción propia.

### 13.2. Dos personas quieren el mismo asiento

La validación de disponibilidad no es suficiente:

```text
Cliente A consulta: libre.
Cliente B consulta: libre.
Ambos intentan crear una entrada para la misma función y butaca.
```

La tabla `entradas` tiene la restricción `uk_entrada_funcion_butaca_vigente` sobre `(funcion_id,butaca_id,vigente)`. Mientras la entrada ocupa asiento, `vigente=TRUE`. La base no puede confirmar dos filas con esa misma combinación no nula. Si una transacción confirma su entrada, la competidora no puede confirmar otra igual; puede tener que esperar y luego fallar. Si la primera revierte, la otra podría prosperar.

El código utiliza `saveAndFlush()` para provocar la sincronización dentro del bloque que traduce `DataIntegrityViolationException` a 409. **Flush no es commit:** los cambios sincronizados todavía pueden revertirse.

Respuesta oral:

> Tenemos una validación previa para dar un error claro, pero la garantía frente a compras simultáneas está en la restricción única de la base sobre función, butaca y vigencia. Guardamos compra y entradas en una transacción. Si otro comprador ya confirmó la misma combinación, la base rechaza la segunda inserción y respondemos 409 para que el usuario seleccione otra butaca. No se confirma una compra parcialmente.

No digas que hay `synchronized`, Redis, una cola de compras, un bloqueo pesimista o `@Version`: no están implementados. Tampoco que necesariamente gana quien hizo clic primero; importa qué transacción consigue completar la operación en la base.

### 13.3. Por qué vigente se vuelve null

En la configuración H2 utilizada, la restricción única permite las filas históricas con null en `vigente`. Así varias cancelaciones pueden conservar la misma pareja función/butaca sin impedir una nueva entrada con TRUE.

```text
funcion_id | butaca_id | vigente | estado
2          | 1         | NULL    | CANCELADA
2          | 1         | NULL    | CANCELADA
2          | 1         | TRUE    | EMITIDA
```

Usar FALSE para todas las canceladas volvería a crear una combinación repetida en sucesivas cancelaciones. Usar solamente función y butaca impediría incluso la primera recompra tras cancelar.

Este comportamiento de NULL y unicidad debe verificarse al cambiar de motor; no conviene presentarlo como una regla idéntica en todos los sistemas SQL.

### 13.4. Alcance de la garantía

La restricción protege esa combinación de entradas. No resuelve por sí sola solapamientos concurrentes de funciones, carreras entre pago y cancelación, vencimiento de pendientes o sincronización entre bases desconectadas.

El test existente compra, vuelve a intentar, cancela y recompra **en secuencia**. Demuestra el flujo secuencial; no es una prueba de dos hilos compitiendo al mismo tiempo. Esa diferencia entre mecanismo implementado y cobertura comprobada es importante.

## 14. JPA, Hibernate y SQL

### 14.1. De objeto a fila

Una instancia nueva de Pelicula es un objeto Java. Al guardarla mediante el repository, JPA/Hibernate organiza su persistencia y genera las sentencias necesarias. `@Entity` define el tipo persistente; `@Table` la tabla; `@Column` propiedades de columnas; `@Id` la clave.

Un campo `Sala sala` con `@ManyToOne` y `@JoinColumn(name="sala_id")` se materializa como una FK, no como una sala Java guardada completa dentro de una celda.

### 14.2. Lado propietario y relaciones bidireccionales

En Cine-Sala, Sala contiene `cine_id` y es el lado propietario del vínculo. `Cine.salas` usa `mappedBy="cine"`: indica el nombre del atributo Java que administra la relación del otro lado. No es el nombre literal de una columna.

`cine.agregarSala(sala)` actualiza ambos lados en memoria. Si solo se agregara a la lista sin establecer `sala.cine`, la FK podría quedar sin el vínculo correcto. Lo mismo ocurre con Sala-Butaca y Compra-Entrada.

### 14.3. Cascade y orphanRemoval

`CascadeType.ALL` propaga operaciones de persistencia a las entidades relacionadas. Guardar una compra permite guardar sus entradas; guardar un cliente permite guardar su usuario. No significa que todas las entidades del sistema se guarden automáticamente, ni que sea un cascade SQL universal.

`orphanRemoval=true` en Cine.salas, Sala.butacas y Compra.entradas indica que quitar un hijo de la relación gestionada puede llevar a borrarlo físicamente. Las bajas actuales no eliminan hijos de colecciones: cambian flags o estados. Por eso no hay que confundir orphanRemoval con baja lógica.

### 14.4. Carga diferida y contexto de persistencia

`FetchType.LAZY` pide cargar una asociación cuando sea necesaria, en vez de traer todo siempre; los detalles concretos dependen del proveedor y del tipo de relación. Las colecciones uno a muchos son diferidas por defecto.

El contexto de persistencia mantiene entidades gestionadas dentro de la unidad de trabajo. Hibernate puede detectar cambios en ellas (**dirty checking**) y sincronizarlos sin que se invoque save por cada setter. Eso explica la confirmación de Compra desde PagoService.

Con `open-in-view=false`, el mapper se ejecuta dentro del service transaccional para acceder a relaciones antes de abandonar ese contexto. Devolver entidades y navegar relaciones diferidas después podría provocar `LazyInitializationException`.

### 14.5. SQL para observar el modelo

Las siguientes consultas son de lectura para la consola H2; no son métodos extra del backend:

```sql
SELECT id, titulo, activa FROM peliculas;

SELECT f.id, p.titulo, s.nombre AS sala, f.fecha_hora_inicio, f.estado
FROM funciones f
JOIN peliculas p ON p.id = f.pelicula_id
JOIN salas s ON s.id = f.sala_id;

SELECT e.funcion_id, e.butaca_id, e.estado, e.vigente,
       c.id AS compra_id, c.estado AS estado_compra
FROM entradas e
JOIN compras c ON c.id = e.compra_id;

SELECT funcion_id, butaca_id, COUNT(*) AS cantidad
FROM entradas
WHERE vigente = TRUE
GROUP BY funcion_id, butaca_id
HAVING COUNT(*) > 1;
```

La última no debería devolver duplicados si el esquema conserva la restricción esperada. Los nombres snake_case corresponden a la estrategia de nombres usada por Spring Boot para estos atributos sin nombre de columna explícito.

### 14.6. Ventajas y límites de la persistencia elegida

H2 en archivo conserva datos al reiniciar y permite consultas SQL y restricciones. No requiere un servicio MySQL aparte. Las pruebas usan otra base en memoria para no tocar datos manuales. `ddl-auto=update` facilita cambios académicos, pero no registra una historia revisable de migraciones como lo haría una herramienta específica.

La arquitectura cliente-servidor no obliga a que el motor esté en otra máquina: el cliente habla con la API, y la API accede a la base. Tampoco `localhost` implica que el código sea incapaz de desplegarse; es la dirección usada para ejecutarlo y probarlo en la propia PC.

## 15. Java y anotaciones para explicar

### 15.1. Anotaciones frecuentes

| Anotación | Explicación aplicada |
| --- | --- |
| `@SpringBootApplication` | Configuración central, autoconfiguración y escaneo. |
| `@Component` | Registra un componente detectado por Spring; lo usa DataSeeder. |
| `@Service` | Especialización de componente para la capa de negocio. |
| `@RestController` | Controller cuyos resultados se escriben en el cuerpo de la respuesta. |
| `@RequestMapping` | Prefijo de rutas del controller. |
| `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, `@PatchMapping` | Método HTTP y ruta atendidos por un método Java. |
| `@RequestBody` | Convierte el body recibido al tipo del parámetro. |
| `@PathVariable` | Obtiene un valor desde un segmento de la URL. |
| `@RequestParam` | Obtiene un parámetro de consulta, como `?genero=DRAMA`. |
| `@DateTimeFormat(iso=DATE)` | Interpreta una fecha de filtro como `AAAA-MM-DD`. |
| `@ResponseStatus` | Define código HTTP exitoso del método. |
| `@CrossOrigin(origins="*")` | Permite orígenes cruzados en navegadores para estos controllers. No autentica usuarios. |
| `@Valid` | Activa validación del DTO recibido por el controller. |
| `@NotNull`, `@NotBlank`, `@NotEmpty` | No nulo; texto con contenido no blanco; colección/texto no vacío, respectivamente. |
| `@Size`, `@Min`, `@DecimalMin`, `@DecimalMax`, `@Email`, `@Future` | Límites de longitud/números, forma de email y fecha futura. |
| `@Transactional` | Límite de trabajo transaccional interceptado por Spring. |
| `@RestControllerAdvice` y `@ExceptionHandler` | Captura compartida y traducción de excepciones a respuestas. |
| `@Entity`, `@Table`, `@Id`, `@GeneratedValue`, `@Column` | Mapeo persistente, identidad y restricciones. |
| `@ManyToOne`, `@OneToMany`, `@OneToOne`, `@JoinColumn` | Relaciones y claves foráneas. |
| `@Enumerated(STRING)` | Guarda nombre del enum y evita depender de su posición ordinal. |
| `@ElementCollection`, `@CollectionTable` | Guarda colección de valores, como formatos de película, en tabla asociada. |
| `@PrePersist`, `@PreUpdate` | Callbacks de persistencia antes de insertar/actualizar. No son tareas programadas. |
| `@Query`, `@Param` | Consulta explícita y asociación de sus parámetros. |
| `@Getter`, `@Setter` | Lombok genera métodos de acceso/modificación. |
| `@RequiredArgsConstructor` | Lombok genera constructor para campos requeridos, aquí los `final`. Spring lo usa para inyección. |
| `@Override` | El compilador comprueba que se implemente/sobrescriba un método, como `run`. |
| `@Test`, `@SpringBootTest`, `@ActiveProfiles`, `@LocalServerPort` | Test, contexto de aplicación, perfil test y puerto asignado. |

No hay `@Repository` explícito en nuestras interfaces; Spring Data las detecta como repositories JPA al construir la aplicación.

### 15.2. Métodos generados, no escritos a mano

En entidades, `@Getter` genera `getId()`, `getTitulo()`, etc.; para boolean primitivo, accesores como `isActiva()`. `@Setter` genera `setTitulo(String titulo)`, `setActivo(boolean activo)`, etc. Un getter devuelve el campo; un setter lo reemplaza. **No validan ni guardan automáticamente por ser getters/setters**. Si el objeto está gestionado, su cambio puede persistirse después por dirty checking.

Para `Boolean vigente`, el getter es `getVigente()`, porque es un wrapper que admite null. Un `boolean` no podría representar el estado null utilizado por la restricción.

Las entidades, al no declarar un constructor propio y usar esas anotaciones, disponen de constructor sin argumentos implícito. JPA necesita un constructor sin argumentos accesible con las condiciones que exige la especificación. Los constructores generados por `@RequiredArgsConstructor` en controllers/services/seeder reciben sus dependencias finales, no los datos de un request.

Los records generan accesores sin prefijo get, constructor, comparación por componentes y representación de texto. No escribimos cuerpos de métodos de negocio en los DTOs.

Evitar `@Data` en entidades reduce riesgos de `toString`, `equals` o `hashCode` recursivos por relaciones bidireccionales y de navegación inesperada de relaciones diferidas. Aquí se eligieron `@Getter` y `@Setter`.

### 15.3. Expresiones Java que pueden preguntarte

| Expresión | Qué significa en el proyecto |
| --- | --- |
| `Optional.orElseThrow(...)` | Devuelve el objeto encontrado o crea una excepción si falta. |
| `stream().map(DtoMapper::to...Response).toList()` | Convierte cada entidad de una colección a su DTO. No es una consulta SQL en sí misma. |
| `filter(...)` | Conserva elementos que cumplen una condición, como entradas no canceladas. |
| `anyMatch(...)` | Devuelve true cuando algún elemento cumple, como una función que se solapa. |
| `reduce(BigDecimal.ZERO, BigDecimal::add)` | Acumula la suma de los importes empezando en cero. |
| `Set` / `HashSet` | Colección sin duplicados. Se usa para detectar IDs repetidos y consultar ocupación por pertenencia. |
| `Set.copyOf(...)` | Copia no modificable del conjunto de formatos que sale en el DTO. |
| `List` / `ArrayList` | Colecciones de entradas, salas y butacas. El orden de carga de una relación no se garantiza solo por usar List. |
| `Long` / `Integer` | Wrappers que admiten null; útiles para IDs aún no asignados o campos que se validan. |
| `LocalDate` | Fecha sin hora: vigencia de promociones o estreno. |
| `LocalDateTime` | Fecha y hora sin zona: programación y marcas temporales del proyecto. |
| `UUID.randomUUID()` | Genera un identificador aleatorio para códigos de entrada y transacción simulada. |
| `Locale.ROOT` | Conversión de texto independiente de la configuración regional para la simulación del token. |
| `final` | Impide reasignar una referencia; no vuelve inmutable todo el objeto referenciado. |
| `static` | Método de clase, como los mappers; no requiere una instancia. |
| `private` | Uso interno de la clase; los helpers no son operaciones públicas del service. |

Las fechas usan el reloj del entorno de ejecución. `LocalDateTime` no conserva un offset horario; el código no implementa una política de múltiples zonas por cine.

## 16. Tests: qué comprueban

Fuentes: [ApiIntegrationTests.java](../src/test/java/com/cineclick/ApiIntegrationTests.java), [CineClickApplicationTests.java](../src/test/java/com/cineclick/CineClickApplicationTests.java).

**Verificación realizada el 30/09/2026:** `mvnw.cmd test`, 10 tests ejecutados, 0 fallos, 0 errores, 0 omitidos, `BUILD SUCCESS`. Esto prueba los escenarios existentes, no ausencia de cualquier defecto.

### 16.1. Cómo funcionan

`ApiIntegrationTests` usa `@SpringBootTest(webEnvironment=RANDOM_PORT)`: levanta aplicación y servidor real en un puerto disponible. `@LocalServerPort` entrega ese puerto al test. `@ActiveProfiles("test")` selecciona H2 en memoria. `TestRestTemplate` realiza las peticiones HTTP; AssertJ compara resultados.

Se configuró `JdkClientHttpRequestFactory` mediante `RestTemplateBuilder` para que el cliente de pruebas soporte PATCH, necesario para cancelar compras. No se reemplazan repositories por mocks: los requests recorren las capas y llegan a la base de pruebas. Son tests de integración, no una colección de unit tests aislados de cada método.

### 16.2. Todos los métodos de test

| Método | Qué verifica y qué no debe exagerarse |
| --- | --- |
| `permiteConsultarRecursosConGet()` | GET de películas devuelve 200 y contiene Interestelar. No recorre todos los recursos GET. |
| `permiteCrearModificarYEliminarPelicula()` | Crea Matrix y espera 201; actualiza título y espera 200; da de baja y espera 204. No verifica después el flag ni su exclusión del listado. |
| `rechazaDatosInvalidosConRespuestaComprensible()` | Registro con nombre/apellido vacíos y email inválido devuelve 400, mensaje esperado y detalles de validación. |
| `informaCuandoUnRecursoNoExiste()` | Película inexistente devuelve 404 con mensaje específico. |
| `permiteCrearClienteConPost()` | Registro devuelve 201, email esperado y activo true. |
| `permiteRecomprarUnaButacaDespuesDeCancelarLaCompra()` | Crea cliente, compra butaca (201), intenta repetir (409), cancela y recompra (201). El flujo es secuencial; la respuesta de cancelación no tiene una aserción directa propia. |
| `filtraFuncionesPorPeliculaYFecha()` | Envía película y fecha; comprueba que haya resultados y que todos tengan esa película. No afirma explícitamente la fecha de cada resultado. |
| `respondeErroresDelClienteSinDevolver500()` | Comprueba 400 para ID no numérico, JSON incompleto, género inválido y formato inválido; 404 para ruta inexistente; 405 para PATCH no soportado. |
| `loginIncorrectoDevuelve401YEmailDuplicado409()` | Credenciales incorrectas producen 401; registro con email del admin produce 409. |
| `url(String path)` | Helper privado del test: concatena localhost, puerto aleatorio y ruta. No es un test. |
| `CineClickApplicationTests.contextLoads()` | Verifica que el contexto Spring pueda arrancar con perfil test. El cuerpo está vacío porque el fallo ocurriría al preparar el contexto. |

El cliente HTTP del test se inicializa como campo mediante constructores de las librerías; no hay un método propio adicional de setup en la clase.

### 16.3. Escenarios sin prueba automatizada dedicada

No hay tests específicos de pago aprobado/rechazado, reintento de pago, promociones vencidas, cálculo exacto de importes, solapamientos concurrentes, doble compra en paralelo, permisos de roles ni vencimiento de reservas. Los requests manuales son útiles, pero su existencia en un archivo no demuestra que hayan sido ejecutados en esta revisión.

## 17. Límites reales del proyecto

Esta sección sirve para contestar con precisión. Distingue funcionalidades implementadas, simplificaciones y riesgos. No presenta estas ausencias como requisitos necesariamente exigidos o exentos por el TP: esa evaluación necesita contrastar cada punto con la consigna.

| Tema | Estado real y consecuencia |
| --- | --- |
| Autenticación y autorización | Se comprueban credenciales y se devuelve rol; no hay JWT, sesión autenticada ni Spring Security. Los endpoints administrativos no verifican ADMIN y las compras/historial no verifican propietario. |
| Contraseñas | Se guardan y comparan directamente, sin hash. Omitirlas del DTO no protege su almacenamiento. Es una limitación relevante, no una característica para producción. |
| Clientes inactivos | Login rechaza usuario inactivo, pero crear compra solo comprueba que exista el Cliente. Una llamada directa con su ID no queda impedida por esa baja. |
| Bajas relacionadas | Dar de baja cine o película no cancela funciones; cancelar función no cancela compras ni pagos. Los listados tienen criterios distintos. |
| Reprogramación con ventas | Actualizar función no bloquea cambios de sala/película cuando existen entradas; podría dejar entradas ligadas a butacas de la sala anterior. No hay validación de ese caso. |
| Reservas temporales | La compra pendiente ya crea entradas vigentes. No existe expiración automática; sin pagar ni cancelar se mantienen ocupadas. |
| Pago rechazado | Queda registrado y bloquea otro pago para la misma compra. Las butacas no se liberan automáticamente. Se puede cancelar y hacer otra compra según el flujo disponible. |
| Cancelación pagada | Puede cancelar compra confirmada, libera entradas, pero no reintegra ni cambia el pago aprobado. |
| Concurrencia | Hay unicidad de entrada vigente. No hay control específico de todas las carreras de pago/cancelación o de programación simultánea. |
| Formato y sala | Se valida que la película tenga el formato; no que la sala esté equipada para él. |
| Vigencia de entidades | Crear/comprar función no realiza todos los controles de actividad de cine, sala y película. El listado de funciones incluye estados cancelados y fechas pasadas. |
| QR | Se guarda un código textual; no hay imagen, escáner ni endpoint de ingreso. `marcarUsada()` no está integrado en un caso HTTP. |
| Estados automáticos | `AGOTADA` y `FINALIZADA` están definidos, pero no se calculan automáticamente. |
| Promociones | Alta y listado. No hay endpoints para actualizar o eliminar. El listado de activas no filtra vencimiento. |
| Email concurrente | La consulta ignora mayúsculas, pero el unique normal de columna no garantiza la misma semántica ante dos altas concurrentes con diferente capitalización. |
| Elementos inválidos de listas | `@NotEmpty` no comprueba que cada ID dentro de `butacasIds` sea no nulo. No hay anotaciones por elemento en ese DTO. |
| CORS | Origen `*` facilita consumo desde otras páginas; no es una restricción de acceso ni una defensa de permisos. |
| Despliegue y nube | No hay replicación H2-nube, sincronización offline ni infraestructura cloud implementada. La configuración es de ejecución local. |
| Datos demo | Los horarios se fijan al sembrar la base; no se actualizan solos con el calendario. No conviene demostrar sobre funciones ya pasadas. |

Respuesta apropiada ante un límite: explicar primero lo que hace el código y luego qué habría que implementar para cubrir el caso. Evitá responder que algo está resuelto solo porque existe una clase o un enum relacionado.

Si el profesor exige restricciones efectivas por rol, el mero login que devuelve ADMIN o CLIENTE no alcanza. Esa diferencia merece revisarse con la consigna antes de afirmar cumplimiento total.

## 18. Preguntas de defensa con respuestas

### 1. ¿Qué problema resuelve?

Centraliza cartelera y programación y permite registrar compras de asientos concretos para una función. Evita que la información de cine, sala, película y ventas quede desconectada.

### 2. ¿Qué es una API REST en este proyecto?

Una interfaz HTTP orientada a recursos: URLs como `/api/peliculas`, métodos como GET/POST/PUT/DELETE y representaciones JSON. Los clientes pueden consumirla sin acceder directamente a H2. Hay también acciones específicas, como PATCH para cancelar una compra.

### 3. ¿Por qué separar controller, service y repository?

Porque tienen motivos distintos para cambiar. El controller conoce HTTP, el service las reglas y el repository el acceso a datos. Para modificar el recargo VIP abro CompraService, no el controller ni la consulta SQL.

### 4. ¿Dónde está el MVC si no hay frontend?

Spring MVC atiende la capa web. Este backend devuelve datos JSON y está organizado por capas. La vista de usuario llegará con el frontend; no tenemos plantillas de vistas renderizadas en el servidor.

### 5. ¿Usan DAO?

Los repositories cumplen el rol de acceso a datos que abstrae un DAO. Son interfaces de Spring Data JPA; no implementamos una segunda capa DAO manual que repita lo mismo.

### 6. ¿Qué diferencia hay entre JPA, Hibernate y Spring Data JPA?

JPA define el contrato y el mapeo. Hibernate lo implementa y genera SQL. Spring Data JPA simplifica el uso mediante repositories e implementación automática de consultas comunes. H2 ejecuta finalmente las consultas.

### 7. ¿Dónde está el SQL si no lo escribieron?

Hibernate lo genera a partir de las operaciones JPA y el modelo. Se observa con `show-sql=true`. Además tenemos una consulta JPQL/HQL explícita en FuncionRepository; esa consulta también se traduce a SQL.

### 8. ¿Por qué H2? ¿Es una base de verdad?

Sí, es un motor relacional SQL con tablas, claves, transacciones y restricciones. En ejecución normal guardamos en archivo para conservar datos y simplificar el arranque; en tests usamos memoria. No hace falta instalar un servidor de base aparte.

### 9. ¿Los datos se pierden cuando cierro la aplicación?

En la configuración normal, no: se guardan en `data/cineclick.mv.db`. Los datos de la base en memoria de tests son temporales. Cambiar el directorio de trabajo también puede hacer que la ruta relativa apunte a otro archivo.

### 10. ¿Qué pasa si cambio a otro motor?

Se reutiliza buena parte de las capas, pero se cambia driver/conexión y se verifica esquema, consulta de funciones y semántica de restricciones. No prometería migración automática sin pruebas, especialmente por el uso de NULL para las entradas canceladas.

### 11. ¿Para qué un DTO si ya hay una entidad?

La entidad modela persistencia y relaciones. El DTO define el contrato HTTP. Permite ocultar password, evitar ciclos al serializar y devolver solo datos necesarios, como nombre de película dentro de una compra.

### 12. ¿Quién calcula el precio?

El servidor. CompraService aplica el tipo de butaca; Compra suma; Promocion aplica descuento. El cliente envía IDs, no un total confiable. Pago toma el total de la compra existente.

### 13. ¿Por qué BigDecimal y no double?

Porque necesitamos aritmética decimal y redondeo explícito para importes. Guardamos 2 decimales y usamos HALF_UP en los cálculos de precio/descuento. Evitamos errores binarios de coma flotante.

### 14. ¿Cuándo se ocupa la butaca?

Al crear la compra pendiente, porque se insertan entradas vigentes. No esperamos al pago. Tampoco hay un temporizador que libere automáticamente si el usuario abandona: es una limitación actual.

### 15. ¿Qué pasa con dos compras simultáneas?

La comprobación previa puede ser superada por ambas. La restricción única función/butaca/vigente impide confirmar dos entradas vigentes iguales. La operación corre en una transacción y el conflicto se transforma en 409. Mostramos `Entrada` y `CompraService` para respaldarlo.

### 16. ¿Por qué saveAndFlush y no save solamente?

Porque queremos sincronizar la escritura en el bloque donde capturamos la violación de integridad. Con save el error podría aparecer más tarde durante la sincronización. Flush no confirma: la transacción aún puede hacer rollback.

### 17. ¿Para qué @Transactional?

Para que el caso de uso persista de manera atómica. Si hay dos entradas y una no puede guardarse, no queremos dejar solo una insertada. También mantiene entidades gestionadas mientras validamos y mapeamos relaciones.

### 18. ¿Qué es dirty checking?

Hibernate detecta cambios en objetos gestionados por el contexto de persistencia y los sincroniza. En PagoService, `compra.confirmar()` cambia su estado dentro de la transacción; por eso se actualiza sin llamar explícitamente a save de Compra.

### 19. ¿Cómo impiden solapamientos de horarios?

Calculan fin como inicio + duración + 20 minutos y comparan intervalos con las funciones no canceladas de la misma sala. Al editar se excluye la función propia. El control actual es de aplicación y no cubre por sí solo dos altas concurrentes.

### 20. ¿Por qué una butaca no tiene ocupado=true?

Porque ocupación depende de la función. A1 puede estar vendida para las 18:00 y libre para las 21:00. Se obtiene consultando las entradas de cada función.

### 21. ¿Compra y Entrada son lo mismo?

No. Compra agrupa el pedido del cliente, su total, promo y pago. Entrada representa cada asiento de esa compra para la función. Una compra puede tener varias entradas.

### 22. ¿Qué hace cancelar con el historial?

Conserva compra y entradas; cambia sus estados y coloca vigente en null para liberar la butaca. No hace un DELETE SQL ni devuelve dinero automáticamente.

### 23. ¿Por qué baja lógica?

Para conservar referencias e historial. Películas, cines y usuarios de clientes pueden quedar inactivos sin romper relaciones. Un GET por ID todavía puede devolverlos; los filtros de listados se aplican explícitamente.

### 24. ¿Todas las consultas ocultan inactivos?

No. Películas y cines se listan activos; clientes se listan todos; funciones no filtran por estado en la consulta general. Hay que describir cada método, no suponer un filtro JPA global.

### 25. ¿Por qué separar Usuario de Cliente?

Usuario contiene identidad y rol. Cliente agrega teléfono y fecha de registro del comprador. Se relacionan uno a uno y tienen IDs distintos. El admin de demo solo necesita Usuario.

### 26. ¿El login protege los endpoints?

No en esta implementación. Verifica email y password y devuelve rol, pero no deja una sesión ni un token para comprobar requests posteriores. Tampoco hay validación de permisos por rol. Es autenticación básica de credenciales, sin autorización aplicada a la API.

### 27. ¿CORS protege la aplicación?

CORS controla solicitudes desde navegadores entre orígenes. Aquí se permite `*`. No impide que un consumidor HTTP llame a un endpoint ni demuestra quién es el usuario.

### 28. ¿Mercado Pago está integrado?

No. `MERCADO_PAGO` es un valor del enum. El servicio simula aprobación salvo que el texto contenga `rechazar`. No hay SDK, llamada externa, webhook ni cobro real.

### 29. ¿Qué ocurre si un pago es rechazado?

Se guarda un pago rechazado y la compra continúa pendiente. Como hay como máximo un pago por compra, el service no permite otro intento sobre esa compra. La cancelación manual libera entradas; no hay recuperación automática implementada.

### 30. ¿Generan un QR real?

Generamos un identificador textual único con prefijo y UUID. Una imagen QR que codifique ese valor y un flujo para validarlo serían partes adicionales. No los presentamos como existentes.

### 31. ¿Por qué enums?

Restringen estados y categorías a valores conocidos y ayudan al compilador y a la validación JSON. Guardarlos como texto hace legible la base y evita depender del orden. No sustituyen validaciones de transición de estado.

### 32. ¿Qué es N+1 y dónde lo trataron?

Es hacer una consulta inicial y muchas consultas adicionales al navegar relaciones de cada resultado. En el listado de funciones usamos join fetch para película, sala y cine. No afirmamos que toda la aplicación esté libre de consultas adicionales.

### 33. ¿Qué diferencia hay entre 400, 401, 404, 409 y 500?

400: entrada o regla inválida. 401: credenciales inválidas en el login. 404: recurso inexistente. 409: conflicto como email duplicado o butaca ocupada. 500: fallo inesperado. Se traducen en GlobalExceptionHandler, con una estructura común.

### 34. ¿Por qué un pago rechazado puede devolver 201?

Porque el endpoint creó el recurso Pago. El resultado comercial está en su estado `RECHAZADO`. El código HTTP describe el resultado de registrar la operación, no afirma que se haya cobrado.

### 35. ¿Cómo saben que funciona?

Tenemos 10 tests de arranque e integración HTTP que pasaron en la revisión, además de requests para pruebas manuales. Comprueban escenarios concretos como CRUD de película, validación, errores y recompra. No tenemos cobertura total ni una prueba concurrente automatizada.

### 36. ¿Por qué Spring puede llamar a una interfaz sin implementación nuestra?

Spring Data crea el objeto que implementa el repository y su lógica de acceso. Para métodos derivados interpreta sus nombres; para buscarConFiltros utiliza la consulta de `@Query`. El contenedor inyecta ese objeto en el service.

### 37. ¿Qué agregaría primero para uso real?

Como evolución, protección efectiva de acceso y contraseñas, reglas de compras pendientes/pagos/cancelaciones, validaciones de reprogramación y más pruebas de concurrencia. Eso describe trabajo futuro, no una capacidad ya hecha ni una ampliación automática del TP.

### 38. ¿Qué relación hay entre esta etapa y el frontend futuro?

El frontend consumirá estos endpoints por HTTP y manejará sus JSON, validaciones visuales, cargas y errores. Las reglas de negocio deben seguir comprobándose en el backend porque el consumidor puede enviar requests directamente.

## 19. Demostración manual

### 19.1. Ejecutar sin afectar una base existente

Desde la raíz del proyecto, en PowerShell:

```powershell
.\mvnw.cmd spring-boot:run
```

La primera vez se requiere conexión para descargar Maven y dependencias que falten. Se necesita JDK 21. La API queda en `http://localhost:8080` si ese puerto está disponible.

Para una base de demo separada, se puede usar otro nombre de archivo en los argumentos de Spring, preservando la base normal:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081 --spring.datasource.url=jdbc:h2:file:./data/cineclick-defensa;DATABASE_TO_LOWER=TRUE;AUTO_SERVER=TRUE"
```

Si ese archivo ya existe, reutiliza sus datos; un nombre nuevo permite sembrar una demo nueva. Ajustá la URL de requests al puerto elegido. Estos comandos son instrucciones de estudio: no se ha levantado un servidor nuevo como parte de escribir la guía.

### 19.2. Recorrido sugerido

1. GET de películas y funciones para mostrar lectura y recuperar IDs reales. Elegí una función futura.
2. Login con admin y explicación de la limitación de permisos.
3. POST de una película, PUT de la misma y DELETE; después GET por ID para mostrar baja lógica.
4. POST de un cliente con email nuevo y lectura de su ID de Cliente.
5. GET de butacas de una función; elegí una con `disponible=true`.
6. POST de compra; explicá cálculo y estado pendiente.
7. Repetí la compra del mismo asiento; mostrará 409.
8. Registrá el pago simulado y consultá compra para ver CONFIRMADA.
9. Cancelá la compra; consultá disponibilidad y recomprá esa butaca.
10. Mostrá en H2 entradas anteriores canceladas y entrada vigente, sin modificar tablas a mano.

El archivo [cineclick-demo.http](../requests/cineclick-demo.http) ofrece cuerpos listos, pero asume IDs y datos de una base recién creada. No conviene ejecutar ciegamente sus IDs ni la fecha de ejemplo. `GET /api/funciones` está ordenado por fecha y su primer elemento no necesariamente tiene ID 1.

Para explicar persistencia, detené y volvé a iniciar usando el mismo archivo y comprobá que los datos continúan. Para la consola H2 usá la URL JDBC del archivo que efectivamente abriste, usuario `sa` y contraseña vacía de esta configuración.

### 19.3. Ejecutar tests y empaquetar

```powershell
.\mvnw.cmd test
.\mvnw.cmd package
java -jar target/cineclick-backend-0.0.1-SNAPSHOT.jar
```

`test` ejecuta las pruebas; `package` compila, ejecuta pruebas y produce el JAR según el ciclo Maven; el plugin de Boot permite empaquetar el ejecutable. En esta revisión se verificó `test`, no se ejecutaron nuevamente los otros dos comandos.

No hace falta un endpoint GET `/` ni una página principal para probar una API backend. Hay que pedir una ruta existente como `/api/peliculas`.

## 20. Plan de estudio y repaso final

### 20.1. Orden recomendado

1. **Comprender el dominio:** explicar película/función, butaca/entrada, compra/pago y Usuario/Cliente sin mirar apuntes.
2. **Seguir el flujo:** abrir CompraController y continuar hasta CompraService, EntradaRepository y Entrada. Contar qué pasa con request, transacción, precio y error.
3. **Entender persistencia:** diferenciar JPA, Hibernate, SQL y H2; explicar FK, unique, cascade y mappedBy con Cine-Sala.
4. **Recorrer todos los métodos:** usar secciones 6 a 11 como referencia y localizar cada uno en el IDE. Saber entradas, resultado, cambios y errores.
5. **Practicar decisiones:** DTOs, baja lógica, BigDecimal, enums, constructor injection y separación por capas.
6. **Practicar límites:** responder con honestidad sobre roles, pagos, QR, concurrencia cubierta y escenarios sin implementar.
7. **Hacer la demo:** completar el recorrido manual usando IDs reales y explicar cada resultado.

### 20.2. Si te señalan un método en el código

Contestá en este orden:

1. A qué capa pertenece y qué responsabilidad tiene.
2. Qué recibe y de dónde llegan esos argumentos.
3. Qué valida y qué colaboradores utiliza.
4. Qué cambia en memoria y qué persiste.
5. Qué devuelve y qué excepciones puede lanzar.
6. Por qué está en esa clase y no en otra capa.

Ejemplo con `FuncionService.validarHorario`: "Es una validación de negocio. Recibe una función candidata y, al editar, su ID para excluirla. Verifica formato, calcula fin y compara horarios con las funciones de la sala obtenidas del repository. Lanza una regla de negocio ante problemas; no arma la respuesta HTTP. Está en el service porque necesita información de varias entidades y una consulta".

### 20.3. Archivos que conviene poder abrir sin buscar demasiado

| Tema de la pregunta | Archivo para mostrar |
| --- | --- |
| Dependencias y versión de Java | [pom.xml](../pom.xml). |
| Configuración H2 y persistencia | [application.properties](../src/main/resources/application.properties). |
| Capas en un caso concreto | [CompraController.java](../src/main/java/com/cineclick/controller/CompraController.java) y [CompraService.java](../src/main/java/com/cineclick/service/CompraService.java). |
| Asiento vendido dos veces | [Entrada.java](../src/main/java/com/cineclick/model/Entrada.java) y el `saveAndFlush` de CompraService. |
| Relación bidireccional y cascade | [Cine.java](../src/main/java/com/cineclick/model/Cine.java) y [Sala.java](../src/main/java/com/cineclick/model/Sala.java). |
| Solapamiento y filtros | [FuncionService.java](../src/main/java/com/cineclick/service/FuncionService.java) y [FuncionRepository.java](../src/main/java/com/cineclick/repository/FuncionRepository.java). |
| Contrato de entrada y validaciones | [CompraRequestDTO.java](../src/main/java/com/cineclick/dto/CompraRequestDTO.java) y [FuncionRequestDTO.java](../src/main/java/com/cineclick/dto/FuncionRequestDTO.java). |
| Qué campos se devuelven | [DtoMapper.java](../src/main/java/com/cineclick/dto/DtoMapper.java). |
| Errores HTTP | [GlobalExceptionHandler.java](../src/main/java/com/cineclick/exception/GlobalExceptionHandler.java). |
| Login y pago reales del código | [AuthService.java](../src/main/java/com/cineclick/service/AuthService.java) y [PagoService.java](../src/main/java/com/cineclick/service/PagoService.java). |
| Evidencia automatizada | [ApiIntegrationTests.java](../src/test/java/com/cineclick/ApiIntegrationTests.java). |

### 20.4. Repaso de dos minutos

- CineClick es una API HTTP/JSON de backend Java 21 con Spring Boot 3.3.4.
- Controller recibe; Service coordina; Repository accede; Model representa; DTO delimita; Mapper convierte; Handler traduce errores.
- JPA define el mapeo, Hibernate lo ejecuta, H2 guarda datos SQL.
- Hay 11 entidades y 32 endpoints; no hay un CRUD independiente para cada entidad.
- La función vincula película, sala y horario. La entrada vincula función y butaca con una compra.
- El precio lo calcula el servidor: VIP +30%, discapacidad -20%, promoción sobre el subtotal.
- La compra pendiente ya ocupa asientos. No existe vencimiento automático.
- La restricción única protege función/butaca/vigente; la cancelación cambia vigente a null.
- `@Transactional` agrupa cambios. Flush sincroniza; commit confirma.
- Login devuelve identidad y rol, pero no protege las rutas. Pago y código QR son simulaciones/datos parciales, no integraciones completas.
- Los 10 tests existentes pasaron; no equivalen a cobertura total ni prueba concurrente.
- Explicar una limitación correctamente demuestra comprensión. Afirmar una función que el código no tiene complica la defensa.

### 20.5. Autoevaluación breve

Podés considerarte preparado cuando puedas explicar sin leer: una compra completa; por qué la restricción única es necesaria además del `if`; por qué cancelación usa null; qué diferencia hay entre entidad y DTO; cómo se calcula 9828.00 para dos VIP con promo; por qué una compra se confirma sin save explícito en PagoService; qué cubren los tests; y qué no hace el login actual.

Los diagramas existentes complementan esta guía: [capas](uml-capas.puml), [clases](uml-codigo-completo.puml) y [secuencia de compra](uml-flujo-compra.puml). Ante diferencias entre una descripción previa y la implementación, el código de esta revisión es la referencia de comportamiento.
