package com.cineclick.service.pago;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.UUID;

@Component
@ConditionalOnProperty(name = "cineclick.pagos.pasarela", havingValue = "simulada", matchIfMissing = true)
public class PasarelaPagoSimulada implements PasarelaPago {

    private static final String PALABRA_RECHAZO = "rechazar";
    private static final String PREFIJO_TRANSACCION = "TX-";

    @Override
    public ResultadoPago procesar(SolicitudPago solicitud) {
        if (debeRechazarse(solicitud.datosPagoToken())) {
            return ResultadoPago.rechazado();
        }
        return ResultadoPago.aprobadoCon(PREFIJO_TRANSACCION + UUID.randomUUID());
    }

    private boolean debeRechazarse(String token) {
        return token != null && token.toLowerCase(Locale.ROOT).contains(PALABRA_RECHAZO);
    }
}
