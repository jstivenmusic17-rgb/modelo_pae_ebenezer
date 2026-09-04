package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CrearEstudianteRequest(

        @NotBlank(message = "documentoIdentidad es obligatorio")
        String documentoIdentidad,

        @NotBlank(message = "nombreCompleto es obligatorio")
        String nombreCompleto,

        @NotNull(message = "idCurso es obligatorio")
        Long idCurso
) {
}
