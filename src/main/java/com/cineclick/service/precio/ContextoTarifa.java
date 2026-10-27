package com.cineclick.service.precio;

import com.cineclick.model.Butaca;
import com.cineclick.model.Cliente;
import com.cineclick.model.Funcion;

public record ContextoTarifa(Funcion funcion, Butaca butaca, Cliente cliente) {
}
