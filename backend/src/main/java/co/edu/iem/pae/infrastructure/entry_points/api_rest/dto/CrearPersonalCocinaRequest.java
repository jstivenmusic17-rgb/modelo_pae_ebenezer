package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record CrearPersonalCocinaRequest(

        @NotBlank(message = "El nombre completo es obligatorio")
        @Pattern(regexp = "[\\p{L} ]+", message = "Nombre invalido: solo se permiten letras y espacios")
        String nombreCompleto,

        @Positive(message = "racionesPorHoraCapacidad debe ser mayor a 0")
        double racionesPorHoraCapacidad,

        @NotNull(message = "idTurno es obligatorio")
        Long idTurno
) {
}
