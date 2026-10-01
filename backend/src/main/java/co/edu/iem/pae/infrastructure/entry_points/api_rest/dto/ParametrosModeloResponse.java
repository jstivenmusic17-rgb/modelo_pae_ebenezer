package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.ParametrosModelo;

public record ParametrosModeloResponse(
        double costoProduccionUnitario,
        double costoFaltanteUnitario,
        double costoSobranteUnitario,
        double coeficienteVariacion,
        double margenSeguridadReferencia,
        double tasaAsistenciaDefecto
) {
    public static ParametrosModeloResponse desde(ParametrosModelo parametros) {
        return new ParametrosModeloResponse(
                parametros.getCostoProduccionUnitario(),
                parametros.getCostoFaltanteUnitario(),
                parametros.getCostoSobranteUnitario(),
                parametros.getCoeficienteVariacion(),
                parametros.getMargenSeguridadReferencia(),
                parametros.getTasaAsistenciaDefecto());
    }
}
