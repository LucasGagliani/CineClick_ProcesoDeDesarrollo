package com.cineclick.service;

import com.cineclick.dto.CineRequestDTO;
import com.cineclick.dto.CineResponseDTO;
import com.cineclick.mapper.CineMapper;
import com.cineclick.dto.SalaRequestDTO;
import com.cineclick.dto.SalaResponseDTO;
import com.cineclick.exception.RecursoNoEncontradoException;
import com.cineclick.model.SalaFactory;
import com.cineclick.model.Cine;
import com.cineclick.model.Sala;
import com.cineclick.repository.CineRepository;
import com.cineclick.repository.SalaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CineService {

    private final CineRepository cineRepository;
    private final SalaRepository salaRepository;

    @Transactional(readOnly = true)
    public List<CineResponseDTO> listar(String ciudad) {
        List<Cine> cines = ciudad == null || ciudad.isBlank()
            ? cineRepository.findByActivoTrue()
            : cineRepository.findByCiudadIgnoreCaseAndActivoTrue(ciudad);
        return cines.stream().map(CineMapper::toCineResponse).toList();
    }

    @Transactional(readOnly = true)
    public CineResponseDTO buscarPorId(Long id) {
        return CineMapper.toCineResponse(buscarEntidad(id));
    }

    @Transactional
    public CineResponseDTO crear(CineRequestDTO dto) {
        Cine cine = new Cine();
        copiarDatos(dto, cine);
        return CineMapper.toCineResponse(cineRepository.save(cine));
    }

    @Transactional
    public CineResponseDTO actualizar(Long id, CineRequestDTO dto) {
        Cine cine = buscarEntidad(id);
        copiarDatos(dto, cine);
        return CineMapper.toCineResponse(cineRepository.save(cine));
    }

    @Transactional
    public void eliminar(Long id) {
        Cine cine = buscarEntidad(id);
        cine.setActivo(false);
        cineRepository.save(cine);
    }

    @Transactional
    public SalaResponseDTO agregarSala(Long cineId, SalaRequestDTO dto) {
        Cine cine = buscarEntidad(cineId);
        Sala sala = SalaFactory.crear(dto.nombre(), dto.numero(), dto.tipo(), dto.cantidadFilas(), dto.butacasPorFila());
        cine.agregarSala(sala);
        cineRepository.save(cine);
        return CineMapper.toSalaResponse(sala);
    }

    @Transactional(readOnly = true)
    public List<SalaResponseDTO> listarSalas(Long cineId) {
        buscarEntidad(cineId);
        return salaRepository.findByCineIdAndActivaTrue(cineId).stream()
            .map(CineMapper::toSalaResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public Cine buscarEntidad(Long id) {
        return cineRepository.findById(id)
            .orElseThrow(() -> new RecursoNoEncontradoException("Cine no encontrado con id " + id));
    }

    private void copiarDatos(CineRequestDTO dto, Cine cine) {
        cine.setNombre(dto.nombre());
        cine.setDireccion(dto.direccion());
        cine.setCiudad(dto.ciudad());
        cine.setTelefono(dto.telefono());
    }
}
