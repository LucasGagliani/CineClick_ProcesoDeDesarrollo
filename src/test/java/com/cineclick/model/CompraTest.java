package com.cineclick.model;

import com.cineclick.exception.ReglaNegocioException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CompraTest {

    @Test
    void unPagoAprobadoConfirmaLaCompra() {
        Compra compra = new Compra();

        compra.registrarPago(pago(true));

        assertThat(compra.getEstado()).isEqualTo(EstadoCompra.CONFIRMADA);
    }

    @Test
    void unPagoRechazadoDejaLaCompraPendienteYNoAdmiteOtroPago() {
        Compra compra = new Compra();

        compra.registrarPago(pago(false));

        assertThat(compra.getEstado()).isEqualTo(EstadoCompra.PENDIENTE_PAGO);
        assertThatThrownBy(() -> compra.registrarPago(pago(true)))
            .isInstanceOf(ReglaNegocioException.class)
            .hasMessage("La compra ya tiene un pago asociado");
    }

    @Test
    void noSePuedeConfirmarNiPagarUnaCompraCancelada() {
        Compra compra = new Compra();
        compra.cancelar();

        assertThatThrownBy(compra::confirmar)
            .isInstanceOf(ReglaNegocioException.class)
            .hasMessage("No se puede confirmar una compra cancelada");
        assertThatThrownBy(() -> compra.registrarPago(pago(true)))
            .isInstanceOf(ReglaNegocioException.class);
        assertThat(compra.getEstado()).isEqualTo(EstadoCompra.CANCELADA);
    }

    @Test
    void noSePuedeCancelarDosVeces() {
        Compra compra = new Compra();
        compra.cancelar();

        assertThatThrownBy(compra::cancelar)
            .isInstanceOf(ReglaNegocioException.class)
            .hasMessage("No se puede cancelar una compra cancelada");
    }

    @Test
    void cancelarAnulaLasEntradas() {
        Compra compra = new Compra();
        compra.emitirEntrada(new Butaca(), BigDecimal.TEN);

        compra.cancelar();

        assertThat(compra.getEntradas()).allMatch(entrada -> entrada.getEstado() == EstadoEntrada.CANCELADA);
    }

    private Pago pago(boolean aprobado) {
        Pago pago = new Pago();
        if (aprobado) {
            pago.confirmar("TX-test");
        } else {
            pago.rechazar();
        }
        return pago;
    }
}
