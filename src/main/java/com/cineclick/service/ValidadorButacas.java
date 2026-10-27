package com.cineclick.service;

import com.cineclick.exception.ButacaNoDisponibleException;
import com.cineclick.exception.RecursoNoEncontradoException;
import com.cineclick.exception.ReglaNegocioException;
import com.cineclick.model.Butaca;
import com.cineclick.model.EstadoEntrada;
import com.cineclick.model.Funcion;
import com.cineclick.repository.ButacaRepository;
import com.cineclick.repository.EntradaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ValidadorButacas {

    private final ButacaRepository butacaRepository;
    private final EntradaRepository entradaRepository;

    public List<Butaca> validarDisponibles(Funcion funcion, List<Long> butacasIds) {
        validarSinDuplicados(butacasIds);
        List<Butaca> butacas = butacaRepository.findAllById(butacasIds);
        if (butacas.size() != butacasIds.size()) {
            throw new RecursoNoEncontradoException("Una o mas butacas solicitadas no existen");
        }
        butacas.forEach(butaca -> validarDisponible(funcion, butaca));
        return butacas;
    }

    private void validarSinDuplicados(List<Long> butacasIds) {
        if (new HashSet<>(butacasIds).size() != butacasIds.size()) {
            throw new ReglaNegocioException("No se puede seleccionar dos veces la misma butaca");
        }
    }

    private void validarDisponible(Funcion funcion, Butaca butaca) {
        if (!butaca.isActiva()) {
            throw new ButacaNoDisponibleException("La butaca " + butaca.codigo() + " no esta activa");
        }
        if (!butaca.getSala().getId().equals(funcion.getSala().getId())) {
            throw new ReglaNegocioException("La butaca " + butaca.codigo() + " no pertenece a la sala de la funcion");
        }
        boolean ocupada = entradaRepository.existsByFuncionIdAndButacaIdAndEstadoNot(
            funcion.getId(),
            butaca.getId(),
            EstadoEntrada.CANCELADA
        );
        if (ocupada) {
            throw new ButacaNoDisponibleException("La butaca " + butaca.codigo() + " ya no esta disponible");
        }
    }
}
