package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record CrearInsumoRequest(

        @NotBlank(message = "nombreInsumo es obligatorio")
        String nombreInsumo,

        @NotBlank(message = "unidadMedida es obligatoria")
        String unidadMedida,

        @Positive(message = "gramosPorRacion debe ser mayor a 0")
        double gramosPorRacion,

        @PositiveOrZero(message = "stockInicialConfigurado no puede ser negativo")
        double stockInicialConfigurado,

        @PositiveOrZero(message = "stockReserva no puede ser negativo")
        double stockReserva,

        @Positive(message = "diasEntregaProveedor debe ser mayor a 0")
        int diasEntregaProveedor
) {
}
