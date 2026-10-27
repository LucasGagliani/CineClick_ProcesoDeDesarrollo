package com.cineclick.service.precio;

import com.cineclick.model.TipoButaca;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class TarifaPorTipoButaca implements Tarifa {

    private final TarifasProperties properties;

    @Override
    public boolean aplicaA(ContextoTarifa contexto) {
        return properties.factorPorTipoButaca().containsKey(tipoDe(contexto));
    }

    @Override
    public BigDecimal aplicar(BigDecimal precio, ContextoTarifa contexto) {
        return precio.multiply(properties.factorPorTipoButaca().get(tipoDe(contexto)));
    }

    private TipoButaca tipoDe(ContextoTarifa contexto) {
        return contexto.butaca().getTipo();
    }
}
