package com.cineclick.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Entity
@Table(name = "promociones")
public class Promocion {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);
    private static final int DECIMALES_PORCENTAJE = 4;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String descripcion;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal porcentajeDescuento;

    @Column(nullable = false)
    private LocalDate fechaInicio;

    @Column(nullable = false)
    private LocalDate fechaFin;

    @Column(nullable = false)
    private boolean activa = true;

    public boolean estaVigente(LocalDate fecha) {
        return activa && !fecha.isBefore(fechaInicio) && !fecha.isAfter(fechaFin);
    }

    public BigDecimal calcularDescuento(BigDecimal total) {
        BigDecimal factor = BigDecimal.ONE.subtract(porcentajeDescuento.divide(CIEN, DECIMALES_PORCENTAJE, Dinero.REDONDEO));
        return Dinero.redondear(total.multiply(factor));
    }
}
