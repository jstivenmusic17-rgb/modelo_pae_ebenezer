package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.EstadisticasResumen;

public record EstadisticasResponse(
        long totalPlanes,
        long totalRacionesPlanificadas,
        long totalRacionesServidas,
        long totalRacionesSobrantes,
        long totalRacionesFaltantes,
        double costoTotalSobrante,
        double costoTotalFaltante,
        double costoTotal
) {
    public static EstadisticasResponse desde(EstadisticasResumen resumen) {
        return new EstadisticasResponse(
                resumen.getTotalPlanes(),
                resumen.getTotalRacionesPlanificadas(),
                resumen.getTotalRacionesServidas(),
                resumen.getTotalRacionesSobrantes(),
                resumen.getTotalRacionesFaltantes(),
                resumen.getCostoTotalSobrante(),
                resumen.getCostoTotalFaltante(),
                resumen.getCostoTotal());
    }
}
