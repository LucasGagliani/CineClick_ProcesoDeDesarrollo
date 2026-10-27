package com.cineclick;

import com.cineclick.dto.ButacaResponseDTO;
import com.cineclick.dto.ClienteRequestDTO;
import com.cineclick.dto.ClienteResponseDTO;
import com.cineclick.dto.CompraRequestDTO;
import com.cineclick.dto.CompraResponseDTO;
import com.cineclick.dto.ErrorResponseDTO;
import com.cineclick.dto.FuncionResponseDTO;
import com.cineclick.dto.LoginRequestDTO;
import com.cineclick.dto.PagoRequestDTO;
import com.cineclick.dto.PagoResponseDTO;
import com.cineclick.dto.PeliculaRequestDTO;
import com.cineclick.dto.PeliculaResponseDTO;
import com.cineclick.model.EstadoCompra;
import com.cineclick.model.EstadoPago;
import com.cineclick.model.FormatoFuncion;
import com.cineclick.model.Genero;
import com.cineclick.model.MetodoPago;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@ActiveProfiles("test")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTests {

    @LocalServerPort
    private int port;

    // El cliente por defecto no soporta PATCH (lo usamos para cancelar compras)
    private final TestRestTemplate restTemplate = new TestRestTemplate(
        new RestTemplateBuilder().requestFactory(() -> new JdkClientHttpRequestFactory())
    );

    @Test
    void permiteConsultarRecursosConGet() {
        ResponseEntity<String> response = restTemplate.getForEntity(url("/api/peliculas"), String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).contains("Interestelar");
    }

    @Test
    void permiteCrearModificarYEliminarPelicula() {
        PeliculaRequestDTO crear = new PeliculaRequestDTO(
            "Matrix",
            "Un programador descubre que la realidad es una simulacion.",
            136,
            "+13",
            Genero.CIENCIA_FICCION,
            "Subtitulada",
            Set.of(FormatoFuncion.DOS_D, FormatoFuncion.IMAX),
            "https://example.com/matrix.jpg",
            LocalDate.of(1999, 3, 31)
        );

        ResponseEntity<PeliculaResponseDTO> post = restTemplate.postForEntity(
            url("/api/peliculas"),
            crear,
            PeliculaResponseDTO.class
        );

        assertThat(post.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(post.getBody()).isNotNull();
        assertThat(post.getBody().titulo()).isEqualTo("Matrix");

        PeliculaRequestDTO actualizar = new PeliculaRequestDTO(
            "Matrix Recargada",
            crear.sinopsis(),
            crear.duracionMinutos(),
            crear.clasificacion(),
            crear.genero(),
            crear.idioma(),
            crear.formatosDisponibles(),
            crear.urlPoster(),
            crear.fechaEstreno()
        );

        ResponseEntity<PeliculaResponseDTO> put = restTemplate.exchange(
            url("/api/peliculas/" + post.getBody().id()),
            HttpMethod.PUT,
            new HttpEntity<>(actualizar),
            PeliculaResponseDTO.class
        );

        assertThat(put.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(put.getBody()).isNotNull();
        assertThat(put.getBody().titulo()).isEqualTo("Matrix Recargada");

        ResponseEntity<Void> delete = restTemplate.exchange(
            url("/api/peliculas/" + post.getBody().id()),
            HttpMethod.DELETE,
            HttpEntity.EMPTY,
            Void.class
        );

        assertThat(delete.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    void rechazaDatosInvalidosConRespuestaComprensible() {
        ClienteRequestDTO invalido = new ClienteRequestDTO("", "", "email-invalido", "1234", "1122334455");

        ResponseEntity<ErrorResponseDTO> response = restTemplate.postForEntity(
            url("/api/clientes"),
            invalido,
            ErrorResponseDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().mensaje()).isEqualTo("Hay datos invalidos");
        assertThat(response.getBody().detalles()).isNotEmpty();
    }

    @Test
    void informaCuandoUnRecursoNoExiste() {
        ResponseEntity<ErrorResponseDTO> response = restTemplate.getForEntity(
            url("/api/peliculas/999999"),
            ErrorResponseDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().mensaje()).contains("Pelicula no encontrada");
    }

    @Test
    void permiteCrearClienteConPost() {
        ClienteRequestDTO request = new ClienteRequestDTO(
            "Ana",
            "Gomez",
            "ana.gomez@example.com",
            "1234",
            "1122334455"
        );

        ResponseEntity<ClienteResponseDTO> response = restTemplate.postForEntity(
            url("/api/clientes"),
            request,
            ClienteResponseDTO.class
        );

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().email()).isEqualTo("ana.gomez@example.com");
        assertThat(response.getBody().activo()).isTrue();
    }

    @Test
    void permiteRecomprarUnaButacaDespuesDeCancelarLaCompra() {
        ClienteResponseDTO cliente = restTemplate.postForEntity(
            url("/api/clientes"),
            new ClienteRequestDTO("Juan", "Diaz", "juan.recompra@example.com", "1234", null),
            ClienteResponseDTO.class
        ).getBody();
        assertThat(cliente).isNotNull();

        FuncionResponseDTO funcion = restTemplate.getForObject(url("/api/funciones"), FuncionResponseDTO[].class)[0];
        ButacaResponseDTO butaca = restTemplate.getForObject(
            url("/api/funciones/" + funcion.id() + "/butacas-disponibles"),
            ButacaResponseDTO[].class
        )[0];
        CompraRequestDTO compra = new CompraRequestDTO(cliente.id(), funcion.id(), List.of(butaca.id()), null);

        ResponseEntity<CompraResponseDTO> primera = restTemplate.postForEntity(url("/api/compras"), compra, CompraResponseDTO.class);
        assertThat(primera.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<ErrorResponseDTO> repetida = restTemplate.postForEntity(url("/api/compras"), compra, ErrorResponseDTO.class);
        assertThat(repetida.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        restTemplate.exchange(url("/api/compras/" + primera.getBody().id() + "/cancelar"), HttpMethod.PATCH, HttpEntity.EMPTY, CompraResponseDTO.class);

        ResponseEntity<CompraResponseDTO> recompra = restTemplate.postForEntity(url("/api/compras"), compra, CompraResponseDTO.class);
        assertThat(recompra.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void pagoRechazadoDejaPendienteYPagoAprobadoConfirmaLaCompra() {
        ClienteResponseDTO cliente = restTemplate.postForEntity(
            url("/api/clientes"),
            new ClienteRequestDTO("Lucia", "Perez", "lucia.pagos@example.com", "1234", null),
            ClienteResponseDTO.class
        ).getBody();
        assertThat(cliente).isNotNull();

        CompraResponseDTO rechazada = comprarUnaButacaLibre(cliente.id());
        ResponseEntity<PagoResponseDTO> pagoRechazado = pagar(rechazada.id(), "token-rechazar", PagoResponseDTO.class);
        assertThat(pagoRechazado.getBody().estado()).isEqualTo(EstadoPago.RECHAZADO);
        assertThat(buscarCompra(rechazada.id()).estado()).isEqualTo(EstadoCompra.PENDIENTE_PAGO);

        CompraResponseDTO aprobada = comprarUnaButacaLibre(cliente.id());
        ResponseEntity<PagoResponseDTO> pagoAprobado = pagar(aprobada.id(), "token-ok", PagoResponseDTO.class);
        assertThat(pagoAprobado.getBody().estado()).isEqualTo(EstadoPago.APROBADO);
        assertThat(buscarCompra(aprobada.id()).estado()).isEqualTo(EstadoCompra.CONFIRMADA);

        ResponseEntity<ErrorResponseDTO> segundoPago = pagar(aprobada.id(), "token-ok", ErrorResponseDTO.class);
        assertThat(segundoPago.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void noPermiteCancelarDosVecesNiPagarUnaCompraCancelada() {
        ClienteResponseDTO cliente = restTemplate.postForEntity(
            url("/api/clientes"),
            new ClienteRequestDTO("Mario", "Lopez", "mario.cancela@example.com", "1234", null),
            ClienteResponseDTO.class
        ).getBody();
        assertThat(cliente).isNotNull();
        CompraResponseDTO compra = comprarUnaButacaLibre(cliente.id());

        assertThat(cancelar(compra.id()).getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<ErrorResponseDTO> otraVez = cancelar(compra.id());
        assertThat(otraVez.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(otraVez.getBody().mensaje()).isEqualTo("No se puede cancelar una compra cancelada");

        ResponseEntity<ErrorResponseDTO> pago = pagar(compra.id(), "token-ok", ErrorResponseDTO.class);
        assertThat(pago.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(pago.getBody().mensaje()).isEqualTo("No se puede confirmar una compra cancelada");
    }

    @Test
    void filtraFuncionesPorPeliculaYFecha() {
        FuncionResponseDTO funcion = restTemplate.getForObject(url("/api/funciones"), FuncionResponseDTO[].class)[0];
        String filtro = "/api/funciones?peliculaId=" + funcion.peliculaId() + "&fecha=" + funcion.fechaHoraInicio().toLocalDate();

        FuncionResponseDTO[] filtradas = restTemplate.getForObject(url(filtro), FuncionResponseDTO[].class);

        assertThat(filtradas).isNotEmpty();
        assertThat(filtradas).allMatch(f -> f.peliculaId().equals(funcion.peliculaId()));
    }

    @Test
    void respondeErroresDelClienteSinDevolver500() {
        HttpHeaders json = new HttpHeaders();
        json.setContentType(MediaType.APPLICATION_JSON);

        assertThat(restTemplate.getForEntity(url("/api/peliculas/abc"), String.class).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(restTemplate.postForEntity(url("/api/peliculas"), new HttpEntity<>("{\"titulo\": ", json), String.class).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        String generoInvalido = """
            {"titulo":"a","sinopsis":"b","duracionMinutos":10,"clasificacion":"ATP",
             "genero":"XX","idioma":"es","formatosDisponibles":["DOS_D"]}
            """;
        assertThat(restTemplate.postForEntity(url("/api/peliculas"), new HttpEntity<>(generoInvalido, json), String.class).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(restTemplate.getForEntity(url("/api/funciones?formato=XX"), String.class).getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(restTemplate.getForEntity(url("/api/no-existe"), String.class).getStatusCode())
            .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(restTemplate.exchange(url("/api/peliculas/1"), HttpMethod.PATCH, HttpEntity.EMPTY, String.class).getStatusCode())
            .isEqualTo(HttpStatus.METHOD_NOT_ALLOWED);
    }

    @Test
    void loginIncorrectoDevuelve401YEmailDuplicado409() {
        ResponseEntity<String> login = restTemplate.postForEntity(
            url("/api/auth/login"),
            new LoginRequestDTO("admin@cineclick.com", "incorrecta"),
            String.class
        );
        assertThat(login.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

        ResponseEntity<String> duplicado = restTemplate.postForEntity(
            url("/api/clientes"),
            new ClienteRequestDTO("Otro", "Admin", "admin@cineclick.com", "1234", null),
            String.class
        );
        assertThat(duplicado.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    private CompraResponseDTO comprarUnaButacaLibre(Long clienteId) {
        FuncionResponseDTO funcion = restTemplate.getForObject(url("/api/funciones"), FuncionResponseDTO[].class)[0];
        ButacaResponseDTO butaca = Arrays.stream(restTemplate.getForObject(
                url("/api/funciones/" + funcion.id() + "/butacas-disponibles"),
                ButacaResponseDTO[].class
            ))
            .filter(ButacaResponseDTO::disponible)
            .findFirst()
            .orElseThrow();
        CompraRequestDTO request = new CompraRequestDTO(clienteId, funcion.id(), List.of(butaca.id()), null);
        ResponseEntity<CompraResponseDTO> response = restTemplate.postForEntity(url("/api/compras"), request, CompraResponseDTO.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return response.getBody();
    }

    private <T> ResponseEntity<T> pagar(Long compraId, String token, Class<T> tipoRespuesta) {
        return restTemplate.postForEntity(
            url("/api/compras/" + compraId + "/pagos"),
            new PagoRequestDTO(MetodoPago.TARJETA_CREDITO, token),
            tipoRespuesta
        );
    }

    private ResponseEntity<ErrorResponseDTO> cancelar(Long compraId) {
        return restTemplate.exchange(url("/api/compras/" + compraId + "/cancelar"), HttpMethod.PATCH, HttpEntity.EMPTY, ErrorResponseDTO.class);
    }

    private CompraResponseDTO buscarCompra(Long compraId) {
        return restTemplate.getForObject(url("/api/compras/" + compraId), CompraResponseDTO.class);
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }
}
