package com.cineclick.service.pago;

import com.cineclick.model.MetodoPago;

import java.math.BigDecimal;

public record SolicitudPago(BigDecimal monto, MetodoPago metodoPago, String datosPagoToken) {
}
