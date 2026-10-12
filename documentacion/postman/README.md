# CineClick en Postman

## Importar y ejecutar

1. En Postman, seleccionar **Import** e importar `CineClick.postman_collection.json` y `CineClick-local.postman_environment.json`.
2. Seleccionar el entorno **CineClick - Local 8081**.
3. Con el backend encendido, abrir la carpeta **00 - Inicio y login** y enviar el primer request. Prepara fechas futuras, email y codigo de promocion unicos para esta ejecucion.
4. Continuar en orden por las carpetas numeradas. Los scripts guardan IDs automaticamente; no hay que copiarlos.
5. Para ejecutar todo de una vez, usar el Runner de Postman sobre la coleccion completa, en el orden original y con una iteracion.

Si usas el backend de IntelliJ en otro puerto, cambiar `baseUrl` del entorno a `http://localhost:8080`. Desde Postman web se necesita el agente de escritorio para acceder al localhost de la PC; tambien se puede usar la aplicacion de escritorio.

## Contenido

- Login de admin y cliente.
- Peliculas, cines, salas, clientes, promociones y funciones.
- Filtros de cartelera y disponibilidad de butacas.
- Compra con promocion, pago aprobado, historial y conflicto por asiento ocupado.
- Cancelacion, recompra, pago rechazado y liberacion de butaca.
- Errores esperados 400, 401, 404, 405 y 409.
- Bajas logicas al terminar.

La coleccion cubre los 32 endpoints implementados. No inventa endpoints de edicion/baja de promociones ni endpoints independientes de butacas o entradas.

## Importante para la prueba

- Se crean datos de demostracion propios: una pelicula, un cine con sala, un cliente, una promocion, una funcion y compras. No se utilizan asientos de otros cines.
- La carpeta final da de baja solo los datos de esa ejecucion. El historial y la promocion permanecen; no hay borrado fisico ni endpoint de baja de promociones.
- Un 400/401/404/405/409 puede ser el resultado correcto: el nombre del request indica cuando se espera un error. Mirar tambien los resultados de tests.
- Los IDs se guardan en variables de coleccion. No crear variables de entorno con esos mismos nombres porque tendrian prioridad sobre los IDs capturados.
- El alta de sala del backend actual puede responder con ID null, aunque la sala se haya guardado. La coleccion obtiene su ID en el GET siguiente de salas; no omitir ese request.
- Para repetir toda la demo, empezar otra vez por el primer login. Para repetir solo la compra, comprobar primero su estado y disponibilidad; un asiento ya ocupado debe dar 409.
- Los requests dependen del orden. Ejecutar una carpeta aislada sin preparar sus IDs puede dar errores.
- El pago es simulado. La API actual no requiere token de sesion y no aplica permisos por rol. Las credenciales de admin incluidas son las de demostracion del proyecto.
- La prueba de asiento repetido es secuencial; no demuestra una carrera entre dos compradores simultaneos.

Referencia de precio: base 1000, una butaca VIP a 1300, promocion del 10%, total esperado 1170.

## Verificacion

El 01/10/2026 se ejecutaron los 58 requests y 87 comprobaciones contra `http://localhost:8081`, con resultado correcto. Se utilizo un runner HTTP local que ejecuta los scripts incluidos con las operaciones de la API `pm` que utiliza la coleccion. No se verifico mediante la interfaz de Postman. La prueba genero datos de demo; el recorrido completo aplico las bajas logicas finales a sus propios registros.
