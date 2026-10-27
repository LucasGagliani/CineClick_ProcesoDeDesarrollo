package com.cineclick;

import com.cineclick.config.PasswordMigration;
import com.cineclick.dto.*;
import com.cineclick.exception.GlobalExceptionHandler;
import com.cineclick.model.*;
import com.cineclick.repository.*;
import com.cineclick.security.PasswordService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;
import java.time.temporal.ChronoUnit;

import static org.assertj.core.api.Assertions.*;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:mejoras-diseno;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1"
})
class MejorasDisenoIntegrationTests {
    @LocalServerPort int port;
    private TestRestTemplate http;
    @Autowired UsuarioRepository usuarios;
    @Autowired CompraRepository compras;
    @Autowired EntradaRepository entradas;
    @Autowired ButacaRepository butacas;
    @Autowired PasswordService passwords;
    @Autowired PasswordMigration migracion;
    @Autowired TransactionTemplate tx;
    @Autowired GlobalExceptionHandler errores;

    @BeforeEach
    void configurarClienteHttp() {
        http = new TestRestTemplate(new RestTemplateBuilder().rootUri("http://localhost:" + port)
            .requestFactory(() -> new JdkClientHttpRequestFactory()));
    }

    @Test
    void editarElPerfilNoExigeNiModificaLaPassword() {
        ClienteResponseDTO cliente = registrar();
        String original = hash(cliente.email());
        ClientePerfilRequestDTO perfil = new ClientePerfilRequestDTO("Ana", "Actualizada", cliente.email(), "1122334455");
        ResponseEntity<ClienteResponseDTO> respuesta = http.exchange("/api/clientes/" + cliente.id(), HttpMethod.PUT,
            new HttpEntity<>(perfil), ClienteResponseDTO.class);
        assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(respuesta.getBody().telefono()).isEqualTo("1122334455");
        assertThat(respuesta.getBody().apellido()).isEqualTo("Actualizada");
        assertThat(hash(cliente.email())).isEqualTo(original);
        assertThat(passwords.esHash(original)).isTrue();
        assertThat(login(cliente.email(), "1234")).isEqualTo(HttpStatus.OK);

        String json = """
            {"nombre":"Ana","apellido":"Cambio","email":"%s","password":"no-cambiar"}
            """.formatted(cliente.email());
        ResponseEntity<String> rechazo = http.exchange("/api/clientes/" + cliente.id(), HttpMethod.PUT, json(json), String.class);
        assertThat(rechazo.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(rechazo.getBody()).contains("/password");
        assertThat(hash(cliente.email())).isEqualTo(original);
        ResponseEntity<String> lectura = http.getForEntity("/api/clientes/" + cliente.id(), String.class);
        assertThat(lectura.getBody()).doesNotContain("password", "pbkdf2", "Cambio");
    }

    @Test
    void cambiarLaPasswordValidaLaActualYRevocaLaAnterior() {
        ClienteResponseDTO cliente = registrar();
        String ruta = "/api/clientes/" + cliente.id() + "/password";
        String original = hash(cliente.email());
        assertThat(cambiarPassword(ruta, "incorrecta", "nueva1234").getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(cambiarPassword(ruta, "1234", "x").getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(hash(cliente.email())).isEqualTo(original);
        assertThat(cambiarPassword(ruta, "1234", "nueva1234").getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        assertThat(hash(cliente.email())).isNotEqualTo(original);
        assertThat(login(cliente.email(), "1234")).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(login(cliente.email(), "nueva1234")).isEqualTo(HttpStatus.OK);
        assertThat(cambiarPassword("/api/clientes/999999/password", "1234", "nueva1234").getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void usuarioInactivoNoPuedeCambiarLaPassword() {
        ClienteResponseDTO cliente = registrar();
        String original = hash(cliente.email());
        http.delete("/api/clientes/" + cliente.id());
        assertThat(cambiarPassword("/api/clientes/" + cliente.id() + "/password", "1234", "nueva1234").getStatusCode())
            .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(hash(cliente.email())).isEqualTo(original);
    }

    @Test
    void perfilValidaDatosYNoPermiteEmailsDuplicados() {
        ClienteResponseDTO a = registrar();
        ClienteResponseDTO b = registrar();
        assertThat(http.exchange("/api/clientes/" + a.id(), HttpMethod.PUT,
            new HttpEntity<>(new ClientePerfilRequestDTO("Ana", "Demo", b.email(), null)), String.class).getStatusCode())
            .isEqualTo(HttpStatus.CONFLICT);
        assertThat(http.exchange("/api/clientes/" + a.id(), HttpMethod.PUT,
            new HttpEntity<>(new ClientePerfilRequestDTO("", "Demo", "invalido", null)), String.class).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(hash(a.email())).isNotNull();
    }

    @Test
    void migrarUsuariosConservaAccesosYNoReprocesaHashes() {
        String email = UUID.randomUUID() + "@migration.test";
        Usuario anterior = new Usuario();
        anterior.setNombre("Anterior");
        anterior.setApellido("Demo");
        anterior.setEmail(email);
        anterior.setRol(RolUsuario.CLIENTE);
        anterior.setPassword("anterior123");
        usuarios.saveAndFlush(anterior);
        migracion.run(new DefaultApplicationArguments());
        String convertido = hash(email);
        assertThat(passwords.esHash(convertido)).isTrue();
        assertThat(login(email, "anterior123")).isEqualTo(HttpStatus.OK);
        migracion.run(new DefaultApplicationArguments());
        assertThat(hash(email)).isEqualTo(convertido);
    }

    @Test
    void crearSalaConservaCapacidadYReportaDuplicadosSinHablarDeButacasVendidas() {
        CineRequestDTO cine = new CineRequestDTO("Cine pruebas", "Direccion 123", "Buenos Aires", "1234");
        CineResponseDTO creado = http.postForObject("/api/cines", cine, CineResponseDTO.class);
        String ruta = "/api/cines/" + creado.id() + "/salas";
        SalaRequestDTO sala = new SalaRequestDTO("Sala prueba", 1, TipoSala.IMAX, 2, 4);
        ResponseEntity<SalaResponseDTO> respuesta = http.postForEntity(ruta, sala, SalaResponseDTO.class);
        assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(respuesta.getBody().capacidad()).isEqualTo(8);
        assertThat(http.getForObject("/api/cines/" + creado.id(), CineResponseDTO.class).salas())
            .extracting(SalaResponseDTO::numero).containsExactly(1);
        ResponseEntity<String> repetida = http.postForEntity(ruta, sala, String.class);
        assertThat(repetida.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(repetida.getBody()).contains("Ya existe una sala").doesNotContain("compradas", "insert into");
        assertThat(http.postForEntity(ruta, new SalaRequestDTO("Grande", 2, TipoSala.IMAX, 27, 4), String.class).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void compraPagoEHistorialConservanSuContratoConLosMappersSeparados() {
        CompraResponseDTO compra = comprar();
        assertThat(compra.estado()).isEqualTo(EstadoCompra.PENDIENTE_PAGO);
        assertThat(compra.entradas()).hasSize(1);
        assertThat(compra.entradas().getFirst().codigoQr()).startsWith("CINECLICK-");
        PagoResponseDTO pago = http.postForObject("/api/compras/" + compra.id() + "/pagos",
            new PagoRequestDTO(MetodoPago.MERCADO_PAGO, "token-demo"), PagoResponseDTO.class);
        assertThat(pago.estado()).isEqualTo(EstadoPago.APROBADO);
        assertThat(pago.monto()).isEqualByComparingTo(compra.total());
        PagoResponseDTO consultado = http.getForObject("/api/pagos/" + pago.id(), PagoResponseDTO.class);
        assertThat(consultado).usingRecursiveComparison().ignoringFields("fechaPago").isEqualTo(pago);
        // H2 persiste fechas con precision de microsegundos.
        assertThat(consultado.fechaPago()).isCloseTo(pago.fechaPago(), within(1, ChronoUnit.MICROS));
        CompraResponseDTO confirmada = http.getForObject("/api/compras/" + compra.id(), CompraResponseDTO.class);
        assertThat(confirmada.estado()).isEqualTo(EstadoCompra.CONFIRMADA);
        assertThat(confirmada.pago()).isEqualTo(consultado);
        assertThat(http.getForObject("/api/clientes/" + compra.clienteId() + "/compras", CompraResponseDTO[].class))
            .containsExactly(confirmada);
        assertThat(http.getForObject("/api/promociones", PromocionResponseDTO[].class))
            .extracting(PromocionResponseDTO::codigo).contains("ESTRENO10");
        assertThat(http.getForEntity("/api/clientes/999999/compras", String.class).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(http.postForEntity("/api/compras/999999/pagos", new PagoRequestDTO(MetodoPago.EFECTIVO, null), String.class)
            .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void soloLaRestriccionDeButacaVigenteSeInformaComoButacaOcupada() {
        CompraResponseDTO compra = comprar();
        DataIntegrityViolationException duplicada = violarIntegridad(compra.id(), e -> {});
        assertThat(mensaje(duplicada)).contains("butacas ya fueron compradas");

        ButacaResponseDTO libre = Arrays.stream(http.getForObject("/api/funciones/" + compra.funcionId()
            + "/butacas-disponibles", ButacaResponseDTO[].class)).filter(ButacaResponseDTO::disponible).findFirst().orElseThrow();
        DataIntegrityViolationException qrDuplicado = violarIntegridad(compra.id(), e -> {
            e.setButaca(butacas.getReferenceById(libre.id()));
            e.setCodigoQr(compra.entradas().getFirst().codigoQr());
        });
        assertThat(mensaje(qrDuplicado)).contains("datos unicos").doesNotContain("butacas", "insert", "constraint");
        DataIntegrityViolationException faltante = violarIntegridad(compra.id(), e -> {
            e.setButaca(butacas.getReferenceById(libre.id()));
            e.setPrecioUnitario(null);
        });
        assertThat(mensaje(faltante)).doesNotContain("butacas", "insert", "constraint");
        assertThat(mensaje(new DataIntegrityViolationException("Error desconocido")))
            .isEqualTo("No se pudo guardar el registro por una restriccion de integridad");
    }

    private DataIntegrityViolationException violarIntegridad(Long compraId, Consumer<Entrada> alterar) {
        Throwable error = catchThrowable(() -> tx.executeWithoutResult(status -> {
            Compra compra = compras.findById(compraId).orElseThrow();
            Entrada entrada = new Entrada();
            entrada.setCompra(compra);
            entrada.setFuncion(compra.getFuncion());
            entrada.setButaca(compra.getEntradas().getFirst().getButaca());
            entrada.setPrecioUnitario(BigDecimal.TEN);
            entrada.generarCodigoQr();
            alterar.accept(entrada);
            entradas.saveAndFlush(entrada);
        }));
        assertThat(error).isInstanceOf(DataIntegrityViolationException.class);
        return (DataIntegrityViolationException) error;
    }

    private String mensaje(DataIntegrityViolationException ex) {
        ResponseEntity<ErrorResponseDTO> respuesta = errores.manejarIntegridad(ex, new MockHttpServletRequest("POST", "/api/compras"));
        assertThat(respuesta.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        return respuesta.getBody().mensaje();
    }

    private CompraResponseDTO comprar() {
        ClienteResponseDTO cliente = registrar();
        FuncionResponseDTO funcion = http.getForObject("/api/funciones", FuncionResponseDTO[].class)[0];
        ButacaResponseDTO butaca = Arrays.stream(http.getForObject("/api/funciones/" + funcion.id()
            + "/butacas-disponibles", ButacaResponseDTO[].class)).filter(ButacaResponseDTO::disponible).findFirst().orElseThrow();
        return http.postForObject("/api/compras", new CompraRequestDTO(cliente.id(), funcion.id(), List.of(butaca.id()), "ESTRENO10"), CompraResponseDTO.class);
    }

    private ClienteResponseDTO registrar() {
        ResponseEntity<ClienteResponseDTO> creado = http.postForEntity("/api/clientes", new ClienteRequestDTO(
            "Ana", "Prueba", UUID.randomUUID() + "@prueba.test", "1234", null), ClienteResponseDTO.class);
        assertThat(creado.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return creado.getBody();
    }

    private String hash(String email) {
        return usuarios.findByEmailIgnoreCase(email).orElseThrow().getPassword();
    }

    private HttpStatusCode login(String email, String password) {
        return http.postForEntity("/api/auth/login", new LoginRequestDTO(email, password), String.class).getStatusCode();
    }

    private ResponseEntity<String> cambiarPassword(String ruta, String actual, String nueva) {
        return http.exchange(ruta, HttpMethod.PUT, new HttpEntity<>(new CambiarPasswordRequestDTO(actual, nueva)), String.class);
    }

    private HttpEntity<String> json(String contenido) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(contenido, headers);
    }
}
