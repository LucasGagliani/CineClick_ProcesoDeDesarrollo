package com.cineclick.service.precio;

import com.cineclick.model.Butaca;
import com.cineclick.model.Funcion;
import com.cineclick.model.TipoButaca;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CalculadoraPrecioEntradaTest {

    private final TarifaPorTipoButaca tarifaPorTipo = new TarifaPorTipoButaca(new TarifasProperties(Map.of(
        TipoButaca.VIP, new BigDecimal("1.30"),
        TipoButaca.DISCAPACIDAD, new BigDecimal("0.80")
    )));

    @Test
    void aplicaElFactorConfiguradoSegunElTipoDeButaca() {
        CalculadoraPrecioEntrada calculadora = new CalculadoraPrecioEntrada(List.of(tarifaPorTipo));

        assertThat(calculadora.calcular(funcion("1000"), butaca(TipoButaca.VIP), null)).isEqualByComparingTo("1300.00");
        assertThat(calculadora.calcular(funcion("1000"), butaca(TipoButaca.DISCAPACIDAD), null)).isEqualByComparingTo("800.00");
        assertThat(calculadora.calcular(funcion("1000"), butaca(TipoButaca.NORMAL), null)).isEqualByComparingTo("1000.00");
    }

    @Test
    void unaTarifaNuevaSeSumaSinModificarLasExistentes() {
        Tarifa mitadDePrecio = new Tarifa() {
            @Override
            public boolean aplicaA(ContextoTarifa contexto) {
                return true;
            }

            @Override
            public BigDecimal aplicar(BigDecimal precio, ContextoTarifa contexto) {
                return precio.multiply(new BigDecimal("0.50"));
            }
        };
        CalculadoraPrecioEntrada calculadora = new CalculadoraPrecioEntrada(List.of(tarifaPorTipo, mitadDePrecio));

        assertThat(calculadora.calcular(funcion("1000"), butaca(TipoButaca.VIP), null)).isEqualByComparingTo("650.00");
    }

    private Funcion funcion(String precioBase) {
        Funcion funcion = new Funcion();
        funcion.setPrecioBase(new BigDecimal(precioBase));
        return funcion;
    }

    private Butaca butaca(TipoButaca tipo) {
        Butaca butaca = new Butaca();
        butaca.setTipo(tipo);
        return butaca;
    }
}
