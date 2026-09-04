package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.Insumo;

public record InsumoResponse(
        Long idInsumo,
        String nombreInsumo,
        String unidadMedida,
        double gramosPorRacion,
        double stockInicialConfigurado,
        double stockReserva,
        int diasEntregaProveedor
) {
    public static InsumoResponse desde(Insumo insumo) {
        return new InsumoResponse(
                insumo.getIdInsumo(),
                insumo.getNombreInsumo(),
                insumo.getUnidadMedida(),
                insumo.getGramosPorRacion(),
                insumo.getStockInicialConfigurado(),
                insumo.getStockReserva(),
                insumo.getDiasEntregaProveedor());
    }
}
