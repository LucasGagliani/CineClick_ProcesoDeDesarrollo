# CineClick: lo esencial para defender mañana

**Objetivo:** poder explicar cómo funciona y por qué está organizado así. Estudiá este resumen; dejá la guía larga para consultar un método puntual. Lectura estimada: 10 a 15 minutos, más práctica oral.

## Índice

1. [Cómo presentar el proyecto](#1-cómo-presentar-el-proyecto)
2. [Tecnologías y capas](#2-tecnologías-y-capas)
3. [El modelo que tenés que entender](#3-el-modelo-que-tenés-que-entender)
4. [Una compra completa](#4-una-compra-completa)
5. [Los métodos y anotaciones importantes](#5-los-métodos-y-anotaciones-importantes)
6. [Las preguntas más probables](#6-las-preguntas-más-probables)
7. [Lo que no debés afirmar](#7-lo-que-no-debés-afirmar)
8. [Plan de estudio de una hora](#8-plan-de-estudio-de-una-hora)

## 1. Cómo presentar el proyecto

Podés arrancar con esto, usando tus palabras:

> CineClick es el backend de una aplicación para comprar entradas de cine. Permite administrar películas, cines, salas y funciones, registrar clientes y realizar compras con pagos simulados. Está hecho en Java con Spring Boot, organizado en capas. Recibe solicitudes HTTP, devuelve JSON y guarda los datos en H2 usando JPA e Hibernate. En esta primera etapa probamos la API sin un frontend definitivo.

**API:** la interfaz por la que otro programa le pide operaciones al backend. Ejemplo: `GET /api/peliculas` pide la cartelera.

## 2. Tecnologías y capas

### Qué usamos y para qué

| Tecnología | Respuesta corta |
| --- | --- |
| **Java 21** | Lenguaje con el que escribimos las clases y reglas del negocio. |
| **Spring Boot 3.3.4** | Facilita configurar y levantar la aplicación con servidor web incluido. |
| **Spring Web / MVC** | Recibe HTTP y dirige cada petición a su controller. |
| **Spring Data JPA** | Implementa los repositories y evita escribir el CRUD repetitivo. |
| **JPA + Hibernate** | JPA define el mapeo entre objetos y tablas; Hibernate lo implementa y genera SQL. |
| **H2** | Base relacional SQL. Se inicia con la aplicación y guarda datos en archivo. |
| **Validation** | Comprueba campos requeridos, emails, fechas y números. |
| **Lombok** | Genera getters, setters y constructores para reducir código repetitivo. |
| **Maven** | Gestiona dependencias, compila y ejecuta tests. |

**Distinción clave:** SQL es un lenguaje; H2 es un motor que utiliza SQL. Hibernate genera consultas y H2 las ejecuta.

### El recorrido que tenés que memorizar

```text
Cliente HTTP -> Controller -> Service -> Repository -> Base de datos
```

| Parte | Responsabilidad | Ejemplo |
| --- | --- | --- |
| **Controller** | Recibe la petición y delega. | `CompraController.crear()`. |
| **Service** | Coordina reglas y transacciones. | Valida butacas y calcula precios. |
| **Repository** | Consulta y guarda entidades. | Busca entradas existentes. |
| **Model** | Representa entidades y su comportamiento. | Compra, Entrada, Pelicula. |
| **DTO** | Define los datos que entran y salen. | La respuesta del cliente omite contraseña. |
| **DtoMapper** | Convierte entidades a DTOs. | Arma la respuesta de una compra. |
| **GlobalExceptionHandler** | Convierte excepciones en errores HTTP. | Butaca ocupada -> 409. |

**¿Por qué separarlo?** Para que cada clase tenga una responsabilidad y podamos cambiar una regla sin mezclarla con HTTP o acceso a datos.

**Patrones para nombrar:** arquitectura por capas, Service Layer, Repository con función de DAO, DTO, Mapper e inyección de dependencias. Spring crea e inyecta los componentes: el controller no construye manualmente su service.

Si preguntan por MVC: usamos Spring MVC para la API; todavía no tenemos vistas HTML de servidor. El frontend consumirá JSON.

## 3. El modelo que tenés que entender

| Concepto | Qué representa |
| --- | --- |
| **Usuario / Cliente** | Usuario guarda acceso y rol; Cliente agrega datos del comprador. Relación uno a uno, IDs diferentes; no es herencia. |
| **Cine / Sala / Butaca** | Un cine tiene salas; cada sala tiene asientos físicos. |
| **Pelicula / Funcion** | Película es el contenido; función es su proyección en una sala, fecha y horario, con precio. |
| **Compra / Entrada** | Compra agrupa el pedido; cada entrada corresponde a una butaca de esa función. |
| **Pago / Promocion** | El pago registra el resultado simulado; la promoción aplica un descuento. |

**La butaca no tiene un “ocupada” global:** puede estar vendida para las 18:00 y libre para las 21:00. La disponibilidad se obtiene de las entradas de cada función.

Una compra puede tener varias entradas, una promoción opcional y como máximo un pago registrado. Una sala puede tener muchas funciones, pero no deberían superponerse sus horarios.

## 4. Una compra completa

Este es el caso que más conviene saber explicar:

1. Llega `POST /api/compras` con cliente, función, IDs de butacas y promoción opcional.
2. El controller valida el DTO y llama a `CompraService.crearCompra()`.
3. El service comprueba que existan cliente y función, y que la función esté programada a futuro.
4. Verifica que las butacas no estén repetidas, existan, estén activas, pertenezcan a la sala y no estén ocupadas.
5. Valida la promoción si se envió una.
6. Crea una entrada por asiento y calcula el precio: normal conserva base, VIP suma 30%, discapacidad descuenta 20%.
7. Suma las entradas y aplica la promoción al subtotal.
8. Guarda compra y entradas dentro de una transacción con `saveAndFlush()`.
9. Convierte a DTO y devuelve **201**, con compra `PENDIENTE_PAGO`.

**El total lo calcula el servidor**, no lo decide el cliente. Se usa `BigDecimal` para dinero y redondeo explícito.

Ejemplo: dos VIP con base 4200 y promo 10%:

```text
4200 x 1.30 = 5460 por entrada
5460 x 2 = 10920 de subtotal
10920 x 0.90 = 9828 de total
```

**Al pagar:** si la simulación aprueba, Pago queda `APROBADO` y Compra `CONFIRMADA`.

**Al cancelar:** compra y entradas quedan canceladas; `vigente` de las entradas pasa a null y las butacas pueden recomprarse. No hay devolución de dinero automática.

## 5. Los métodos y anotaciones importantes

No memorices todos los getters. Entendé estos comportamientos:

| Método | Qué hace |
| --- | --- |
| `listar()` / `buscarPorId()` | Consultan datos; el segundo suele lanzar 404 si no encuentra. |
| `crear()` / `actualizar()` | Copian datos, aplican reglas, guardan y devuelven DTO. |
| `eliminar()` | En los CRUD actuales realiza baja lógica, no borrado físico. |
| `buscarEntidad()` | Devuelve el objeto del modelo para usarlo dentro del negocio. |
| `FuncionService.validarHorario()` | Controla formato de película, fecha futura y cruces de horario de sala. |
| `Funcion.calcularHorarioFin()` | Inicio + duración de película + 20 minutos de margen. |
| `CompraService.crearCompra()` | Coordina todo el proceso de compra. |
| `Compra.calcularTotal()` | Suma precios de entradas y aplica promoción. |
| `PagoService.registrarPago()` | Registra el pago simulado y confirma la compra si se aprueba. |
| `Compra.cancelar()` / `Entrada.cancelar()` | Cambian estados y liberan la ocupación del asiento. |
| `AuthService.login()` | Comprueba email, contraseña y usuario activo; devuelve identidad y rol. |
| `DataSeeder.run()` | Carga datos de demostración al arrancar cuando corresponde. |

**Anotaciones:** `@RestController` expone HTTP; `@Service` identifica negocio; `@Entity` mapea una entidad; `@Id` indica su clave; `@OneToMany`/`@ManyToOne` describen relaciones; `@Valid` valida el DTO; `@Transactional` delimita la transacción.

**HTTP:** GET consulta, POST crea, PUT actualiza, DELETE da de baja y PATCH se usa para cancelar. Respuestas principales: **200** correcto, **201** creado, **204** sin contenido, **400** datos/regla inválida, **401** login incorrecto, **404** inexistente, **409** conflicto, **500** error inesperado.

## 6. Las preguntas más probables

### ¿Qué pasa si dos clientes compran el mismo asiento?

> Validamos disponibilidad antes, pero eso solo no alcanza: ambos podrían verlo libre. La base tiene una restricción única sobre función, butaca y vigente. No puede confirmar dos entradas vigentes iguales. Si hay conflicto, la compra se revierte y devolvemos 409.

### ¿Por qué vigente pasa a null al cancelar?

> Para conservar el historial sin bloquear la recompra. En nuestra configuración H2, las filas canceladas con null pueden coexistir, mientras solo puede existir una combinación igual con vigente en TRUE.

### ¿Para qué sirve @Transactional?

> Para guardar el caso de uso como una unidad. Si una entrada falla, se revierte el conjunto y no queda una compra parcial. No significa que automáticamente se resuelvan todas las carreras concurrentes.

### ¿Qué diferencia hay entre save y saveAndFlush?

> save guarda mediante JPA; saveAndFlush además fuerza la sincronización con la base para detectar restricciones en ese punto. Flush no es commit: todavía se puede revertir.

### ¿Por qué DTOs en lugar de devolver entidades?

> Para controlar qué exponemos, omitir contraseñas y evitar ciclos de relaciones en el JSON. El DTO es el contrato de la API; la entidad representa el modelo persistido.

### ¿Por qué baja lógica?

> Para conservar el historial y las referencias. Marcamos el registro inactivo en vez de borrarlo; un GET por ID todavía puede encontrarlo.

### ¿Cómo funcionan repositories que son interfaces?

> Spring Data genera su implementación. Heredan operaciones de JpaRepository y puede crear consultas por nombres como findByActivaTrue. Cumplen el rol de acceso a datos de un DAO.

### ¿Cómo evitan dos funciones al mismo tiempo en una sala?

> Calculamos su intervalo, incluyendo los 20 minutos de margen, y lo comparamos con funciones no canceladas de la sala. Al editar excluimos la misma función. Este chequeo no tiene un control específico de altas simultáneas.

### ¿Por qué se actualiza la compra en PagoService sin guardar explícitamente la compra?

> Porque JPA detecta cambios en entidades gestionadas dentro de la transacción. Eso se llama dirty checking: al confirmar la compra, Hibernate sincroniza el cambio de estado.

### ¿Cómo probaron que funciona?

> Tenemos tests de integración que levantan la aplicación y llaman por HTTP con H2 en memoria. En la revisión pasaron los 10 tests. Incluyen CRUD, errores y compra/cancelación/recompra; no prueban todos los casos ni dos compradores realmente en paralelo.

## 7. Lo que no debés afirmar

Estos puntos evitan respuestas incorrectas:

- **El login no protege endpoints por rol.** Devuelve ADMIN o CLIENTE, pero no hay sesión, JWT ni autorización aplicada. Las contraseñas están guardadas sin hash.
- **Los pagos son simulados.** No hay conexión a Mercado Pago: se rechaza si el token contiene `rechazar`; en otro caso se aprueba.
- **La compra pendiente ya ocupa butacas.** No existe vencimiento automático. Un pago rechazado no las libera ni permite otro pago en esa misma compra.
- **Cancelar no reintegra dinero.** Cambia estados y libera entradas.
- **El QR es un código textual con UUID**, no una imagen ni un sistema de escaneo implementado.
- **H2 no se sincroniza con la nube.** Guarda datos localmente en archivo. Los datos de tests usan otra base, en memoria.

Si preguntan por algo de esta lista, explicá el alcance actual con claridad. Tener un enum o una clase no implica tener implementado todo el flujo.

## 8. Plan de estudio de una hora

1. **10 minutos:** explicá en voz alta la presentación, las tecnologías y las capas.
2. **20 minutos:** abrí `CompraController`, `CompraService` y `Entrada`; seguí una compra y ubicá la restricción única.
3. **20 minutos:** respondé las diez preguntas de la sección 6 sin leer y corregí lo que te falte.
4. **10 minutos:** repasá los límites y explicá el caso completo una vez más.

**Si te señalan cualquier método:** decí qué recibe, qué valida, qué consulta o modifica y qué devuelve. No hace falta recitar cada línea.

**Idea central para llevarte:** el controller recibe; el service decide; el repository accede a datos; el modelo representa el negocio; el DTO define la respuesta. La transacción evita compras parciales y la restricción única evita duplicar el mismo asiento vigente.
