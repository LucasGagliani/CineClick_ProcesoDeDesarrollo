package com.cineclick.service.precio;

import java.math.BigDecimal;

/**
 * Regla de precio de una entrada. Para sumar una tarifa nueva (estudiantes, jubilados, etc.)
 * alcanza con crear otro @Component que implemente esta interfaz.
 */
public interface Tarifa {

    boolean aplicaA(ContextoTarifa contexto);

    BigDecimal aplicar(BigDecimal precio, ContextoTarifa contexto);
}
