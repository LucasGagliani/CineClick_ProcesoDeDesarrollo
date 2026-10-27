package com.cineclick.mapper;

import com.cineclick.dto.PeliculaResponseDTO;
import com.cineclick.model.Pelicula;
import java.util.Set;

public final class PeliculaMapper {
    private PeliculaMapper() {
    }

    public static PeliculaResponseDTO toPeliculaResponse(Pelicula pelicula) {
        return new PeliculaResponseDTO(
            pelicula.getId(),
            pelicula.getTitulo(),
            pelicula.getSinopsis(),
            pelicula.getDuracionMinutos(),
            pelicula.getClasificacion(),
            pelicula.getGenero(),
            pelicula.getIdioma(),
            Set.copyOf(pelicula.getFormatosDisponibles()),
            pelicula.getUrlPoster(),
            pelicula.getFechaEstreno(),
            pelicula.isActiva()
        );
    }
}
