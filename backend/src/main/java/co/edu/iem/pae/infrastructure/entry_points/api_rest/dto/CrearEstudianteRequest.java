package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CrearEstudianteRequest(

        @NotBlank(message = "El numero de documento es obligatorio")
        @Pattern(regexp = "\\d{6,15}", message = "Numero de documento invalido: solo se permiten numeros (entre 6 y 15 digitos)")
        String documentoIdentidad,

        @NotBlank(message = "El nombre completo es obligatorio")
        @Pattern(regexp = "[\\p{L} ]+", message = "Nombre invalido: solo se permiten letras y espacios")
        String nombreCompleto,

        @NotNull(message = "idCurso es obligatorio")
        Long idCurso
) {
}
