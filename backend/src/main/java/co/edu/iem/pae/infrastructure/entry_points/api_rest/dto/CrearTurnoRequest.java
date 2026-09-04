package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record CrearTurnoRequest(

        @NotBlank(message = "nombreTurno es obligatorio")
        String nombreTurno,

        @Positive(message = "horasDuracion debe ser mayor a 0")
        double horasDuracion
) {
}
