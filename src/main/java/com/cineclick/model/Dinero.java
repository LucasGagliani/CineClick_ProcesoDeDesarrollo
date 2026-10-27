package com.cineclick.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class Dinero {

    public static final int DECIMALES = 2;
    public static final RoundingMode REDONDEO = RoundingMode.HALF_UP;

    private Dinero() {
    }

    public static BigDecimal redondear(BigDecimal monto) {
        return monto.setScale(DECIMALES, REDONDEO);
    }
}
