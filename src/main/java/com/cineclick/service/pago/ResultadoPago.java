package com.cineclick.service.pago;

public record ResultadoPago(boolean aprobado, String codigoTransaccion) {

    public static ResultadoPago aprobadoCon(String codigoTransaccion) {
        return new ResultadoPago(true, codigoTransaccion);
    }

    public static ResultadoPago rechazado() {
        return new ResultadoPago(false, null);
    }
}
