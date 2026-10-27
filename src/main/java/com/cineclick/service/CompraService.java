package com.cineclick.service;

import com.cineclick.dto.CompraRequestDTO;
import com.cineclick.dto.CompraResponseDTO;
import com.cineclick.dto.DtoMapper;
import com.cineclick.exception.ButacaNoDisponibleException;
import com.cineclick.exception.RecursoNoEncontradoException;
import com.cineclick.exception.ReglaNegocioException;
import com.cineclick.model.Butaca;
import com.cineclick.model.Cliente;
import com.cineclick.model.Compra;
import com.cineclick.model.Funcion;
import com.cineclick.model.Promocion;
import com.cineclick.repository.CompraRepository;
import com.cineclick.service.precio.CalculadoraPrecioEntrada;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompraService {

    private final CompraRepository compraRepository;
    private final ClienteService clienteService;
    private final FuncionService funcionService;
    private final PromocionService promocionService;
    private final ValidadorButacas validadorButacas;
    private final CalculadoraPrecioEntrada calculadoraPrecio;

    @Transactional
    public CompraResponseDTO crearCompra(CompraRequestDTO dto) {
        Cliente cliente = clienteService.buscarEntidad(dto.clienteId());
        Funcion funcion = buscarFuncionEnVenta(dto.funcionId());
        List<Butaca> butacas = validadorButacas.validarDisponibles(funcion, dto.butacasIds());

        Compra compra = new Compra();
        compra.setCliente(cliente);
        compra.setFuncion(funcion);
        buscarPromocion(dto.codigoPromocion()).ifPresent(compra::setPromocion);
        butacas.forEach(butaca -> compra.emitirEntrada(butaca, calculadoraPrecio.calcular(funcion, butaca, cliente)));
        compra.calcularTotal();

        return DtoMapper.toCompraResponse(guardar(compra));
    }

    @Transactional(readOnly = true)
    public CompraResponseDTO buscarPorId(Long id) {
        return DtoMapper.toCompraResponse(buscarEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<CompraResponseDTO> listarPorCliente(Long clienteId) {
        clienteService.buscarEntidad(clienteId);
        return compraRepository.findByClienteId(clienteId).stream().map(DtoMapper::toCompraResponse).toList();
    }

    @Transactional
    public CompraResponseDTO cancelar(Long id) {
        Compra compra = buscarEntidad(id);
        compra.cancelar();
        return DtoMapper.toCompraResponse(compraRepository.save(compra));
    }

    @Transactional(readOnly = true)
    public Compra buscarEntidad(Long id) {
        return compraRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Compra no encontrada con id " + id));
    }

    private Funcion buscarFuncionEnVenta(Long funcionId) {
        Funcion funcion = funcionService.buscarEntidad(funcionId);
        if (!funcion.estaDisponibleParaVenta()) {
            throw new ReglaNegocioException("La funcion no esta disponible para la venta");
        }
        return funcion;
    }

    private Optional<Promocion> buscarPromocion(String codigoPromocion) {
        if (codigoPromocion == null || codigoPromocion.isBlank()) {
            return Optional.empty();
        }
        return Optional.of(promocionService.validarPromocionParaCompra(codigoPromocion));
    }

    private Compra guardar(Compra compra) {
        try {
            return compraRepository.saveAndFlush(compra);
        } catch (DataIntegrityViolationException ex) {
            throw new ButacaNoDisponibleException("Una o mas butacas ya fueron compradas para esta funcion");
        }
    }
}
