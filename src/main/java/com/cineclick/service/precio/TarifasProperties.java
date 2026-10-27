package com.cineclick.service.precio;

import com.cineclick.model.TipoButaca;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.Map;

@Validated
@ConfigurationProperties(prefix = "cineclick.tarifas")
public record TarifasProperties(@NotNull Map<TipoButaca, BigDecimal> factorPorTipoButaca) {
}
