package co.edu.iem.pae.domain.model;

import java.time.LocalDate;

public class MovimientoInsumo {

    private final Long idMovimiento;
    private final Long idInsumo;
    private final LocalDate fecha;
    private final double stockInicialKg;
    private final double cantidadRecibidaKg;
    private final double consumoDelDiaKg;

    public MovimientoInsumo(Long idMovimiento, Long idInsumo, LocalDate fecha, double stockInicialKg,
                             double cantidadRecibidaKg, double consumoDelDiaKg) {
        this.idMovimiento = idMovimiento;
        this.idInsumo = idInsumo;
        this.fecha = fecha;
        this.stockInicialKg = stockInicialKg;
        this.cantidadRecibidaKg = cantidadRecibidaKg;
        this.consumoDelDiaKg = consumoDelDiaKg;
    }

    public Long getIdMovimiento() {
        return idMovimiento;
    }

    public Long getIdInsumo() {
        return idInsumo;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public double getStockInicialKg() {
        return stockInicialKg;
    }

    public double getCantidadRecibidaKg() {
        return cantidadRecibidaKg;
    }

    public double getConsumoDelDiaKg() {
        return consumoDelDiaKg;
    }

    public double getStockFinalKg() {
        return stockInicialKg + cantidadRecibidaKg - consumoDelDiaKg;
    }
}
