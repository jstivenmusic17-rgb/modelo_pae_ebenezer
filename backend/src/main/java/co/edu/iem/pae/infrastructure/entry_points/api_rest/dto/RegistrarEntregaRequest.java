package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record RegistrarEntregaRequest(

        @NotNull(message = "idPlan es obligatorio")
        Long idPlan,

        @NotNull(message = "racionesServidas es obligatorio")
        @PositiveOrZero(message = "racionesServidas no puede ser negativo")
        Integer racionesServidas
) {
}
