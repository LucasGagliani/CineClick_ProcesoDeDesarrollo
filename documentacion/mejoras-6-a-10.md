# Implementación de las mejoras 6 a 10

Esta entrega implementa los cinco puntos de la lista de mejoras basada en code smells, GRASP y SOLID. Mantiene Spring Boot, JPA, H2, DTOs, controladores y servicios del proyecto. Se conservan las mejoras 1 a 5 que ya estaban en este repositorio. Los módulos nuevos de candyshop y proveedores quedan fuera de esta entrega.

El diagrama actualizado de esta integración está en `uml-mejoras-6-a-10.puml`. Los diagramas generales anteriores describen la versión inicial del proyecto.

## 6 Delegar la creación de salas y butacas

**Problema:** `CineService` también construía la distribución de butacas. Cambiar esa distribución obligaba a modificar el servicio que administra los cines.

**Cambio:** `SalaFactory` construye la sala y sus butacas, valida las dimensiones y establece las referencias de cada butaca a su sala. `CineService` solo busca el cine, solicita la sala y la guarda asociada al cine. El seeder del backend también reutiliza la fábrica. El script de datos del frontend sigue usando los endpoints públicos.

Se conserva la distribución de la API: filas A a Z, asientos numerados desde 1, las dos primeras butacas de cada fila VIP y las restantes normales. El DTO limita las filas a 26 y la fábrica también valida ese límite cuando se utiliza fuera de HTTP.

**Fundamento:** GRASP Creador y alta cohesión; SOLID responsabilidad única. Se elimina el bucle de construcción de la gestión del cine sin modificar los precios ni las reglas de venta.

## 7 Dividir el mapeador por área funcional

**Problema:** un único archivo conocía las respuestas de todos los módulos.

**Cambio:** se reemplaza `DtoMapper` por siete mapeadores en el paquete `mapper`: `PeliculaMapper`, `CineMapper` (incluye salas y butacas), `FuncionMapper`, `ClienteMapper`, `CompraMapper` (incluye entradas), `PagoMapper` y `PromocionMapper`.

Se conservan los campos y estructuras JSON de las respuestas. `CompraMapper` delega la representación del pago a `PagoMapper`. La conversión se sigue realizando dentro de la transacción del servicio para acceder correctamente a las relaciones JPA.

**Fundamento:** SOLID responsabilidad única y GRASP alta cohesión. Las clases se agrupan por área funcional, sin agregar interfaces sin necesidad.

## 8 Reducir el acoplamiento entre servicios

**Problema:** para recuperar una entidad, un servicio dependía de otro servicio de administración completo.

**Cambio:** `PagoService` consulta `CompraRepository`; `CompraService` consulta `ClienteRepository` y `FuncionRepository`. Para listar el historial, comprueba la existencia del cliente mediante su repositorio. Las búsquedas conservan sus errores 404 y las operaciones mantienen sus transacciones.

La dependencia de `CompraService` con `PromocionService` se conserva porque ejecuta una regla de negocio: verificar la vigencia de la promoción. Reemplazarla por una lectura directa habría omitido esa validación.

**Fundamento:** GRASP bajo acoplamiento. Se utilizan las interfaces de repositorio existentes en lugar de introducir un servicio genérico que conozca todo el sistema.

## 9 Separar perfil y contraseña

**Problema:** modificar el teléfono o nombre requería enviar una contraseña y podía sobrescribirla por accidente. Además, las credenciales se almacenaban en texto plano.

**Cambio:** se mantienen el registro con `ClienteRequestDTO` y el login actual. Se agrega `ClientePerfilRequestDTO` para editar datos personales, y `CambiarPasswordRequestDTO` para un cambio explícito de contraseña.

### Edición del perfil

`PUT /api/clientes/{id}` recibe nombre, apellido, email y teléfono; ya no exige contraseña ni la modifica. Si se envía `password`, responde 400 e indica el endpoint de cambio de contraseña.

```json
{
  "nombre": "Ana",
  "apellido": "Demo",
  "email": "cliente.demo@cineclick.com",
  "telefono": "1122334455"
}
```

### Cambio de contraseña

`PUT /api/clientes/{id}/password` recibe la contraseña actual y la nueva. Responde 204 sin contenido cuando el cambio se completa. Devuelve 401 si la contraseña actual es incorrecta o el usuario está inactivo, 400 si los campos son inválidos y 404 si el cliente no existe. Las solicitudes rechazadas no cambian las credenciales.

```json
{
  "passwordActual": "demo1234",
  "passwordNueva": "demo5678"
}
```

`PasswordService` centraliza la codificación y verificación con PBKDF2-HMAC-SHA256, 600000 iteraciones, sal aleatoria de 16 bytes y resultado de 256 bits. La comparación del resultado usa `MessageDigest.isEqual`. Se mantiene el límite actual de 4 a 120 caracteres para contraseñas nuevas, incluyendo Unicode.

`PasswordMigration` convierte al arrancar las contraseñas antiguas a hashes, conservando el valor que cada usuario ingresa para iniciar sesión. Se ejecuta antes de los seeders y no vuelve a codificar hashes existentes. El registro, el seeder y el cambio de contraseña utilizan el mismo componente. Las respuestas de cliente y login no incluyen hashes ni contraseñas; los DTOs con credenciales también ocultan esos valores en su `toString`.

**Integración con el frontend:** la pantalla de perfil ya no envía `password` y tiene un formulario independiente de cambio de contraseña que usa el endpoint nuevo. Los endpoints de registro y login mantienen sus campos actuales. Este cambio no agrega sesiones, tokens ni autorización por propietario: el login mantiene el alcance previo del proyecto.

**Fundamento:** SOLID responsabilidad única y separación de operaciones con motivos de cambio distintos.

## 10 Distinguir conflictos de persistencia

**Problema:** cualquier error de integridad al guardar una compra terminaba informado como una butaca ocupada, aunque la causa fuera otra.

**Cambio:** se elimina la captura general de `DataIntegrityViolationException` en `CompraService`. Se conserva `saveAndFlush`, de modo que los conflictos se detecten al guardar. La excepción llega al manejador central, que utiliza `ConflictoIntegridad` para traducir metadatos de la restricción y el estado SQL.

| Causa | Respuesta |
| --- | --- |
| Restricción `uk_entrada_funcion_butaca_vigente` | 409 con mensaje de butacas ya compradas |
| Número de sala repetido dentro del mismo cine | 409 con mensaje de sala duplicada |
| Fila y número de butaca repetidos dentro de una sala | 409 con mensaje de butaca duplicada |
| Otra unicidad violada | 409 con mensaje de datos únicos duplicados |
| Datos obligatorios ausentes reportados por SQL | 409 con mensaje de datos obligatorios faltantes |
| Referencias inexistentes o en uso reportadas por SQL | 409 con mensaje de referencias inválidas |
| Otra restricción de integridad | 409 con mensaje general de integridad, sin afirmar que la butaca está ocupada |

No se exponen SQL, nombres internos de restricciones ni datos de la excepción en la respuesta. Se mantiene el formato JSON de errores existente y el código 409 de los conflictos de integridad. Las validaciones habituales de solicitudes siguen respondiendo 400.

**Fundamento:** GRASP indirección y bajo acoplamiento. La traducción de errores de persistencia queda fuera del proceso de compra.

## Verificación

Ejecutar `./mvnw test` o `.\mvnw.cmd test` en Windows. La suite incluye las pruebas anteriores y las siguientes:

- `SalaFactoryTests`: distribución completa, referencias, tipos de butaca, códigos únicos y dimensiones límite.
- `PasswordServiceTests`: sal aleatoria, contraseña Unicode de 120 caracteres, rechazo de credenciales incorrectas y hashes inválidos.
- `MejorasDisenoIntegrationTests`: edición de perfil sin cambio de contraseña, rechazo de contraseña en perfil, validación de emails y campos, cambio de contraseña, usuario inactivo, migración repetible, creación y duplicación de salas, compra, pago e historial con los mapeadores separados.
- La prueba de integridad provoca errores reales en H2: butaca duplicada, código de entrada repetido y un dato obligatorio ausente. Comprueba que solo el primer caso se presenta como una butaca ocupada.

Los datos de pruebas se guardan en bases H2 en memoria, separadas de `data/cineclick.mv.db`.

### Frontend

`npm run build` dentro de `frontend/` compila la aplicación. Con el backend y el frontend ejecutándose, `npm run test:perfil` ejecuta una prueba de navegador de registro, edición de perfil sin contraseña, confirmación de contraseña distinta, contraseña actual incorrecta, cambio correcto y acceso con la contraseña nueva en una sesión nueva. También comprueba la limpieza de campos y que no exista desbordamiento horizontal en móvil. La configuración está explicada en `frontend/README.md`.

La prueba de navegador crea un cliente ficticio y guarda capturas de escritorio y móvil en el directorio temporal del sistema. Los cambios de los puntos 1 a 5 (validador de butacas, cálculo de tarifas, pasarela de pago, reglas de estado y constantes) permanecen en sus componentes originales.
