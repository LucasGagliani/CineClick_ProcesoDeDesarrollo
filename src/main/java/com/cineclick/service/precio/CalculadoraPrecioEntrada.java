package com.cineclick.service.precio;

import com.cineclick.model.Butaca;
import com.cineclick.model.Cliente;
import com.cineclick.model.Dinero;
import com.cineclick.model.Funcion;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CalculadoraPrecioEntrada {

    private final List<Tarifa> tarifas;

    public BigDecimal calcular(Funcion funcion, Butaca butaca, Cliente cliente) {
        ContextoTarifa contexto = new ContextoTarifa(funcion, butaca, cliente);
        BigDecimal precio = funcion.getPrecioBase();
        for (Tarifa tarifa : tarifas) {
            if (tarifa.aplicaA(contexto)) {
                precio = tarifa.aplicar(precio, contexto);
            }
        }
        return Dinero.redondear(precio);
    }
}
