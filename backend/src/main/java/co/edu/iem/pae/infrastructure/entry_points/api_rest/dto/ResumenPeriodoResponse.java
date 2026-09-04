package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.ResumenPeriodo;

public record ResumenPeriodoResponse(
        long diasConDatos,
        double costoTotalEjecutado,
        double costoPromedioPorRacion,
        double errorAbsolutoMedio
) {
    public static ResumenPeriodoResponse desde(ResumenPeriodo resumen) {
        return new ResumenPeriodoResponse(
                resumen.getDiasConDatos(),
                resumen.getCostoTotalEjecutado(),
                resumen.getCostoPromedioPorRacion(),
                resumen.getErrorAbsolutoMedio());
    }
}
