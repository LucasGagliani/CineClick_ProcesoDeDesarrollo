package com.cineclick.model;

import com.cineclick.exception.ReglaNegocioException;

/** Construye salas completas; no conoce HTTP ni la persistencia. */
public final class SalaFactory {
    private SalaFactory() {
    }

    public static Sala crear(String nombre, Integer numero, TipoSala tipo, int filas, int butacasPorFila) {
        if (filas < 1 || filas > Sala.MAXIMO_FILAS) {
            throw new ReglaNegocioException("La cantidad de filas debe estar entre 1 y 26");
        }
        if (butacasPorFila < 1) {
            throw new ReglaNegocioException("Debe haber al menos una butaca por fila");
        }
        Sala sala = new Sala();
        sala.setNombre(nombre);
        sala.setNumero(numero);
        sala.setTipo(tipo);
        for (int fila = 0; fila < filas; fila++) {
            for (int asiento = 1; asiento <= butacasPorFila; asiento++) {
                Butaca butaca = new Butaca();
                butaca.setFila(String.valueOf((char) ('A' + fila)));
                butaca.setNumero(asiento);
                butaca.setTipo(asiento <= Sala.BUTACAS_VIP_POR_FILA ? TipoButaca.VIP : TipoButaca.NORMAL);
                sala.agregarButaca(butaca);
            }
        }
        return sala;
    }
}
