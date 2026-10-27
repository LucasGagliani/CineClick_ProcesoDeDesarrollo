package com.cineclick.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.cineclick.exception.ReglaNegocioException;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ClientePerfilRequestDTO(
    @NotBlank @Size(max = 80) String nombre,
    @NotBlank @Size(max = 80) String apellido,
    @NotBlank @Email @Size(max = 120) String email,
    @Size(max = 40) String telefono
) {
    // Una solicitud antigua que incluya password debe usar la operacion explicita
    // de cambio de contraseña, evitando sobrescribirla al editar el perfil.
    @JsonAnySetter
    public void campoAdicional(String nombre, Object valor) {
        if (nombre.equals("password")) {
            throw new ReglaNegocioException("Para cambiar la contraseña use PUT /api/clientes/{id}/password");
        }
    }
}
