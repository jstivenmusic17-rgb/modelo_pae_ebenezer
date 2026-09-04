package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CrearCursoRequest(

        @NotBlank(message = "nombreCurso es obligatorio")
        String nombreCurso,

        @NotNull(message = "idJornada es obligatorio")
        Long idJornada
) {
}
