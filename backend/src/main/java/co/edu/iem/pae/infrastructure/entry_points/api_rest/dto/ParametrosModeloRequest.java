package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.ParametrosModelo;
import jakarta.validation.constraints.NotNull;

public record ParametrosModeloRequest(
        @NotNull(message = "El costo de produccion por racion es obligatorio")
        Double costoProduccionUnitario,

        @NotNull(message = "El costo por racion faltante es obligatorio")
        Double costoFaltanteUnitario,

        @NotNull(message = "El costo por racion sobrante es obligatorio")
        Double costoSobranteUnitario,

        @NotNull(message = "La variabilidad de la asistencia es obligatoria")
        Double coeficienteVariacion,

        @NotNull(message = "El margen de seguridad de referencia es obligatorio")
        Double margenSeguridadReferencia,

        @NotNull(message = "La asistencia esperada por defecto es obligatoria")
        Double tasaAsistenciaDefecto
) {
    public ParametrosModelo aDominio() {
        return new ParametrosModelo(costoProduccionUnitario, costoFaltanteUnitario, costoSobranteUnitario,
                coeficienteVariacion, margenSeguridadReferencia, tasaAsistenciaDefecto);
    }
}
