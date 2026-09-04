package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

public record RegistrarMovimientoRequest(

        @NotNull(message = "fecha es obligatoria")
        LocalDate fecha,

        @PositiveOrZero(message = "cantidadRecibidaKg no puede ser negativa")
        double cantidadRecibidaKg
) {
}
