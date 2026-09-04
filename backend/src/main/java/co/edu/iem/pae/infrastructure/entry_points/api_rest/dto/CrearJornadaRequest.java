package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;

public record CrearJornadaRequest(

        @NotBlank(message = "nombreJornada es obligatorio")
        String nombreJornada
) {
}
