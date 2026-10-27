package com.cineclick.mapper;

import com.cineclick.dto.ClienteResponseDTO;
import com.cineclick.model.Cliente;

public final class ClienteMapper {
    private ClienteMapper() {
    }

    public static ClienteResponseDTO toClienteResponse(Cliente cliente) {
        return new ClienteResponseDTO(
            cliente.getId(),
            cliente.getUsuario().getId(),
            cliente.getUsuario().getNombre(),
            cliente.getUsuario().getApellido(),
            cliente.getUsuario().getEmail(),
            cliente.getTelefono(),
            cliente.getFechaRegistro(),
            cliente.getUsuario().isActivo()
        );
    }
}
