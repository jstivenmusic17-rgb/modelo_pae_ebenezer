package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.EntregaRacion;

public record EntregaRacionResponse(
        Long idEntrega,
        Long idPlan,
        int racionesServidas,
        int racionesSobrantes,
        int racionesFaltantes,
        double costoTotalDesviacion
) {
    public static EntregaRacionResponse desde(EntregaRacion entrega) {
        return new EntregaRacionResponse(
                entrega.getIdEntrega(),
                entrega.getIdPlan(),
                entrega.getRacionesServidas(),
                entrega.getRacionesSobrantes(),
                entrega.getRacionesFaltantes(),
                entrega.getCostoTotalDesviacion());
    }
}
