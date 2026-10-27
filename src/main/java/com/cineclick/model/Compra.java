package com.cineclick.model;

import com.cineclick.exception.ReglaNegocioException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "compras")
public class Compra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime fechaCompra;

    @Setter(AccessLevel.NONE)
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total = BigDecimal.ZERO;

    // Sin setter: el estado solo cambia por confirmar/cancelar, que validan la transicion.
    @Setter(AccessLevel.NONE)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EstadoCompra estado = EstadoCompra.PENDIENTE_PAGO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcion_id", nullable = false)
    private Funcion funcion;

    @Setter(AccessLevel.NONE)
    @OneToMany(mappedBy = "compra", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Entrada> entradas = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "promocion_id")
    private Promocion promocion;

    @Setter(AccessLevel.NONE)
    @OneToOne(mappedBy = "compra", cascade = CascadeType.ALL)
    private Pago pago;

    @PrePersist
    public void prePersist() {
        if (fechaCompra == null) {
            fechaCompra = LocalDateTime.now();
        }
    }

    public void emitirEntrada(Butaca butaca, BigDecimal precioUnitario) {
        Entrada entrada = new Entrada();
        entrada.setCompra(this);
        entrada.setFuncion(funcion);
        entrada.setButaca(butaca);
        entrada.setPrecioUnitario(precioUnitario);
        entrada.generarCodigoQr();
        entradas.add(entrada);
    }

    public BigDecimal calcularTotal() {
        BigDecimal subtotal = entradas.stream()
            .map(Entrada::getPrecioUnitario)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        total = promocion == null ? subtotal : promocion.calcularDescuento(subtotal);
        return total;
    }

    public void validarQueAceptaPago() {
        validarTransicionA(EstadoCompra.CONFIRMADA);
        if (pago != null) {
            throw new ReglaNegocioException("La compra ya tiene un pago asociado");
        }
    }

    public void registrarPago(Pago pago) {
        validarQueAceptaPago();
        this.pago = pago;
        if (pago.estaAprobado()) {
            confirmar();
        }
    }

    public void confirmar() {
        cambiarEstado(EstadoCompra.CONFIRMADA);
    }

    public void cancelar() {
        cambiarEstado(EstadoCompra.CANCELADA);
        entradas.forEach(Entrada::cancelar);
    }

    private void cambiarEstado(EstadoCompra nuevoEstado) {
        validarTransicionA(nuevoEstado);
        estado = nuevoEstado;
    }

    private void validarTransicionA(EstadoCompra nuevoEstado) {
        if (!estado.permiteTransicionA(nuevoEstado)) {
            throw new ReglaNegocioException("No se puede " + nuevoEstado.accion() + " una compra " + estado.descripcion());
        }
    }
}
