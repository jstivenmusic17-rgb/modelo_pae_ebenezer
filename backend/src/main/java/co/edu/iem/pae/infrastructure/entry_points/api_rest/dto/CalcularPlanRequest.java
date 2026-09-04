package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.time.LocalDate;

public record CalcularPlanRequest(

        @NotNull(message = "idCurso es obligatorio")
        Long idCurso,

        @NotNull(message = "fecha es obligatoria")
        LocalDate fecha,

        @NotNull(message = "tasaAsistenciaEstimada es obligatoria")
        @DecimalMin(value = "0.5", message = "tasaAsistenciaEstimada parece muy baja, revisa el valor (minimo 0.5 = 50%)")
        @DecimalMax(value = "1.0", message = "tasaAsistenciaEstimada debe ser como maximo 1.0 (100%)")
        Double tasaAsistenciaEstimada,

        @NotNull(message = "costoSobranteUnitario es obligatorio")
        @PositiveOrZero(message = "costoSobranteUnitario no puede ser negativo")
        Double costoSobranteUnitario,

        @NotNull(message = "costoFaltanteUnitario es obligatorio")
        @PositiveOrZero(message = "costoFaltanteUnitario no puede ser negativo")
        Double costoFaltanteUnitario,

        @DecimalMin(value = "0.0", message = "coeficienteVariacion no puede ser negativo")
        Double coeficienteVariacion,

        @PositiveOrZero(message = "costoProduccionUnitario no puede ser negativo")
        Double costoProduccionUnitario,

        @DecimalMin(value = "0.0", message = "margenSeguridad no puede ser negativo")
        Double margenSeguridad
) {
}
