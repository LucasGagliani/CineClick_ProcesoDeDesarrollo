package com.cineclick.mapper;

import com.cineclick.dto.FuncionResponseDTO;
import com.cineclick.model.Funcion;

public final class FuncionMapper {
    private FuncionMapper() {
    }

    public static FuncionResponseDTO toFuncionResponse(Funcion funcion) {
        return new FuncionResponseDTO(
            funcion.getId(),
            funcion.getPelicula().getId(),
            funcion.getPelicula().getTitulo(),
            funcion.getSala().getCine().getId(),
            funcion.getSala().getCine().getNombre(),
            funcion.getSala().getId(),
            funcion.getSala().getNombre(),
            funcion.getFechaHoraInicio(),
            funcion.getFechaHoraFin(),
            funcion.getPrecioBase(),
            funcion.getFormato(),
            funcion.getIdioma(),
            funcion.getEstado()
        );
    }
}
