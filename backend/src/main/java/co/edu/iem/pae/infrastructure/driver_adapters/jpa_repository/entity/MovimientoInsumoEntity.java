package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "movimiento_insumo", schema = "pae")
public class MovimientoInsumoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_movimiento")
    private Long idMovimiento;

    @Column(name = "id_insumo", nullable = false)
    private Long idInsumo;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "stock_inicial_kg", nullable = false)
    private double stockInicialKg;

    @Column(name = "cantidad_recibida_kg", nullable = false)
    private double cantidadRecibidaKg;

    @Column(name = "consumo_del_dia_kg", nullable = false)
    private double consumoDelDiaKg;

    protected MovimientoInsumoEntity() {
    }

    public MovimientoInsumoEntity(Long idMovimiento, Long idInsumo, LocalDate fecha, double stockInicialKg,
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

    public void setIdMovimiento(Long idMovimiento) {
        this.idMovimiento = idMovimiento;
    }

    public Long getIdInsumo() {
        return idInsumo;
    }

    public void setIdInsumo(Long idInsumo) {
        this.idInsumo = idInsumo;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public double getStockInicialKg() {
        return stockInicialKg;
    }

    public void setStockInicialKg(double stockInicialKg) {
        this.stockInicialKg = stockInicialKg;
    }

    public double getCantidadRecibidaKg() {
        return cantidadRecibidaKg;
    }

    public void setCantidadRecibidaKg(double cantidadRecibidaKg) {
        this.cantidadRecibidaKg = cantidadRecibidaKg;
    }

    public double getConsumoDelDiaKg() {
        return consumoDelDiaKg;
    }

    public void setConsumoDelDiaKg(double consumoDelDiaKg) {
        this.consumoDelDiaKg = consumoDelDiaKg;
    }
}
