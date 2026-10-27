package com.cineclick.service.pago;

/**
 * Medio externo que autoriza o rechaza un pago. PagoService solo conoce esta interfaz,
 * asi se puede cambiar la simulacion por una pasarela real sin tocar el registro de la compra.
 */
public interface PasarelaPago {

    ResultadoPago procesar(SolicitudPago solicitud);
}
