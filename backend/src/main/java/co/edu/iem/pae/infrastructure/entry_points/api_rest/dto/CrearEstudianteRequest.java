package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CrearEstudianteRequest(

        @NotBlank(message = "documentoIdentidad es obligatorio")
        @Pattern(regexp = "\\d{6,15}", message = "documentoIdentidad debe contener solo numeros (6 a 15 digitos)")
        String documentoIdentidad,

        @NotBlank(message = "nombreCompleto es obligatorio")
        @Pattern(regexp = "[\\p{L} ]+", message = "nombreCompleto debe contener solo letras y espacios")
        String nombreCompleto,

        @NotNull(message = "idCurso es obligatorio")
        Long idCurso
) {
}
