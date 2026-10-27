package com.cineclick.mapper;

import com.cineclick.dto.PromocionResponseDTO;
import com.cineclick.model.Promocion;

public final class PromocionMapper {
    private PromocionMapper() {
    }

    public static PromocionResponseDTO toPromocionResponse(Promocion promocion) {
        return new PromocionResponseDTO(
            promocion.getId(),
            promocion.getCodigo(),
            promocion.getDescripcion(),
            promocion.getPorcentajeDescuento(),
            promocion.getFechaInicio(),
            promocion.getFechaFin(),
            promocion.isActiva()
        );
    }
}
