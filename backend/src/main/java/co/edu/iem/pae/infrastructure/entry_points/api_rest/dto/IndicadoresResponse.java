package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.IndicadoresOperativos;

public record IndicadoresResponse(
        Long idPlan,
        double tasaDesperdicio,
        double tasaFaltante,
        double coberturaEfectiva,
        double porcentajeAusentismo,
        double rendimientoCocina,
        double umbralCoberturaMinima,
        boolean alertaCoberturaBaja
) {
    public static IndicadoresResponse desde(IndicadoresOperativos indicadores) {
        return new IndicadoresResponse(
                indicadores.getIdPlan(),
                indicadores.getTasaDesperdicio(),
                indicadores.getTasaFaltante(),
                indicadores.getCoberturaEfectiva(),
                indicadores.getPorcentajeAusentismo(),
                indicadores.getRendimientoCocina(),
                indicadores.getUmbralCoberturaMinima(),
                indicadores.isAlertaCoberturaBaja());
    }
}
