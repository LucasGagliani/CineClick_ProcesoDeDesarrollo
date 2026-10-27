package com.cineclick.service;

import com.cineclick.dto.DtoMapper;
import com.cineclick.dto.PagoRequestDTO;
import com.cineclick.dto.PagoResponseDTO;
import com.cineclick.exception.RecursoNoEncontradoException;
import com.cineclick.model.Compra;
import com.cineclick.model.Pago;
import com.cineclick.repository.PagoRepository;
import com.cineclick.service.pago.PasarelaPago;
import com.cineclick.service.pago.ResultadoPago;
import com.cineclick.service.pago.SolicitudPago;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PagoService {

    private final PagoRepository pagoRepository;
    private final CompraService compraService;
    private final PasarelaPago pasarelaPago;

    @Transactional
    public PagoResponseDTO registrarPago(Long compraId, PagoRequestDTO dto) {
        Compra compra = compraService.buscarEntidad(compraId);
        compra.validarQueAceptaPago();

        ResultadoPago resultado = pasarelaPago.procesar(
            new SolicitudPago(compra.getTotal(), dto.metodoPago(), dto.datosPagoToken())
        );
        Pago pago = new Pago();
        pago.setCompra(compra);
        pago.setMonto(compra.getTotal());
        pago.setMetodoPago(dto.metodoPago());
        if (resultado.aprobado()) {
            pago.confirmar(resultado.codigoTransaccion());
        } else {
            pago.rechazar();
        }

        compra.registrarPago(pago);
        return DtoMapper.toPagoResponse(pagoRepository.save(pago));
    }

    @Transactional(readOnly = true)
    public PagoResponseDTO buscarPorId(Long id) {
        Pago pago = pagoRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Pago no encontrado con id " + id));
        return DtoMapper.toPagoResponse(pago);
    }
}
