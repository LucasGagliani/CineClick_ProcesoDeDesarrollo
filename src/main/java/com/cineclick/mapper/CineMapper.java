package com.cineclick.mapper;

import com.cineclick.dto.CineResponseDTO;
import com.cineclick.dto.SalaResponseDTO;
import com.cineclick.dto.ButacaResponseDTO;
import com.cineclick.model.Cine;
import com.cineclick.model.Sala;
import com.cineclick.model.Butaca;
import java.util.Comparator;

public final class CineMapper {
    private CineMapper() {
    }

    public static CineResponseDTO toCineResponse(Cine cine) {
        return new CineResponseDTO(
            cine.getId(),
            cine.getNombre(),
            cine.getDireccion(),
            cine.getCiudad(),
            cine.getTelefono(),
            cine.isActivo(),
            cine.getSalas().stream()
                .sorted(Comparator.comparing(Sala::getNumero))
                .map(CineMapper::toSalaResponse)
                .toList()
        );
    }

    public static SalaResponseDTO toSalaResponse(Sala sala) {
        return new SalaResponseDTO(
            sala.getId(),
            sala.getNombre(),
            sala.getNumero(),
            sala.getTipo(),
            sala.isActiva(),
            sala.capacidad()
        );
    }

    public static ButacaResponseDTO toButacaResponse(Butaca butaca, boolean disponible) {
        return new ButacaResponseDTO(
            butaca.getId(),
            butaca.getFila(),
            butaca.getNumero(),
            butaca.codigo(),
            butaca.getTipo(),
            disponible
        );
    }
}
