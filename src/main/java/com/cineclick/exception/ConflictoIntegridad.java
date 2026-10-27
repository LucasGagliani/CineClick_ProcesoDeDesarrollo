package com.cineclick.exception;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;

import java.sql.SQLException;
import java.util.Locale;

/** Traduce metadatos de restricciones sin mostrar SQL ni datos internos al cliente. */
public final class ConflictoIntegridad {
    private ConflictoIntegridad() {
    }

    public static String mensaje(DataIntegrityViolationException ex) {
        for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
            if (causa instanceof ConstraintViolationException restriccion) {
                String nombre = restriccion.getConstraintName();
                if (nombre != null) {
                    // H2 informa el nombre del indice de respaldo, por ejemplo
                    // PUBLIC.UK_ENTRADA_FUNCION_BUTACA_VIGENTE_INDEX_7.
                    String normalizado = nombre.replace("\"", "").toLowerCase(Locale.ROOT);
                    if (coincide(normalizado, "uk_entrada_funcion_butaca_vigente")) {
                        return "Una o mas butacas ya fueron compradas para esta funcion";
                    }
                    if (coincide(normalizado, "uk_sala_cine_numero")) {
                        return "Ya existe una sala con ese numero en el cine";
                    }
                    if (coincide(normalizado, "uk_butaca_sala_codigo")) {
                        return "Ya existe una butaca con esa fila y numero en la sala";
                    }
                }
            }
        }
        for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
            if (causa instanceof SQLException sql) {
                return switch (sql.getSQLState() == null ? "" : sql.getSQLState()) {
                    case "23505" -> "Ya existe un registro con esos datos unicos";
                    case "23502" -> "Faltan datos obligatorios para guardar el registro";
                    case "23503", "23506" -> "El registro hace referencia a datos inexistentes o en uso";
                    case "22001" -> "Uno de los datos supera la longitud permitida";
                    default -> "No se pudo guardar el registro por una restriccion de integridad";
                };
            }
        }
        return "No se pudo guardar el registro por una restriccion de integridad";
    }

    private static boolean coincide(String nombre, String restriccion) {
        String simple = nombre.substring(nombre.lastIndexOf('.') + 1);
        return simple.equals(restriccion) || simple.startsWith(restriccion + "_index_");
    }
}
