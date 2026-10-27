package com.cineclick.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarPasswordRequestDTO(
    @NotBlank @Size(max = 120) String passwordActual,
    @NotBlank @Size(min = 4, max = 120) String passwordNueva
) {
    @Override
    public String toString() {
        return "CambiarPasswordRequestDTO[credenciales ocultas]";
    }
}
