package com.cineclick.mapper;

import com.cineclick.dto.PagoResponseDTO;
import com.cineclick.model.Pago;

public final class PagoMapper {
    private PagoMapper() {
    }

    public static PagoResponseDTO toPagoResponse(Pago pago) {
        return new PagoResponseDTO(
            pago.getId(),
            pago.getMonto(),
            pago.getMetodoPago(),
            pago.getEstado(),
            pago.getFechaPago(),
            pago.getCodigoTransaccion()
        );
    }
}
