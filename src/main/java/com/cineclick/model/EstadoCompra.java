package com.cineclick.model;

public enum EstadoCompra {
    PENDIENTE_PAGO("pendiente de pago", "dejar pendiente"),
    CONFIRMADA("confirmada", "confirmar"),
    CANCELADA("cancelada", "cancelar");

    private final String descripcion;
    private final String accion;

    EstadoCompra(String descripcion, String accion) {
        this.descripcion = descripcion;
        this.accion = accion;
    }

    public boolean permiteTransicionA(EstadoCompra destino) {
        return switch (this) {
            case PENDIENTE_PAGO -> destino == CONFIRMADA || destino == CANCELADA;
            case CONFIRMADA -> destino == CANCELADA;
            case CANCELADA -> false;
        };
    }

    public String descripcion() {
        return descripcion;
    }

    public String accion() {
        return accion;
    }
}
