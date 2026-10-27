package com.cineclick.mapper;

import com.cineclick.dto.CompraResponseDTO;
import com.cineclick.dto.EntradaResponseDTO;
import com.cineclick.model.Compra;
import com.cineclick.model.Entrada;

public final class CompraMapper {
    private CompraMapper() {
    }

    public static CompraResponseDTO toCompraResponse(Compra compra) {
        return new CompraResponseDTO(
            compra.getId(),
            compra.getCliente().getId(),
            compra.getCliente().nombreCompleto(),
            compra.getFuncion().getId(),
            compra.getFuncion().getPelicula().getTitulo(),
            compra.getFechaCompra(),
            compra.getTotal(),
            compra.getEstado(),
            compra.getEntradas().stream().map(CompraMapper::toEntradaResponse).toList(),
            compra.getPago() == null ? null : PagoMapper.toPagoResponse(compra.getPago())
        );
    }

    public static EntradaResponseDTO toEntradaResponse(Entrada entrada) {
        return new EntradaResponseDTO(
            entrada.getId(),
            entrada.getCodigoQr(),
            entrada.getButaca().getFila(),
            entrada.getButaca().getNumero(),
            entrada.getButaca().codigo(),
            entrada.getPrecioUnitario(),
            entrada.getEstado()
        );
    }
}
