package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.MovimientoInsumo;

import java.time.LocalDate;

public record MovimientoInsumoResponse(
        Long idMovimiento,
        Long idInsumo,
        LocalDate fecha,
        double stockInicialKg,
        double cantidadRecibidaKg,
        double consumoDelDiaKg,
        double stockFinalKg
) {
    public static MovimientoInsumoResponse desde(MovimientoInsumo movimiento) {
        return new MovimientoInsumoResponse(
                movimiento.getIdMovimiento(),
                movimiento.getIdInsumo(),
                movimiento.getFecha(),
                movimiento.getStockInicialKg(),
                movimiento.getCantidadRecibidaKg(),
                movimiento.getConsumoDelDiaKg(),
                movimiento.getStockFinalKg());
    }
}
