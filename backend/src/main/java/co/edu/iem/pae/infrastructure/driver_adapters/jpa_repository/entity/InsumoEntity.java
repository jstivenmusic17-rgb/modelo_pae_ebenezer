package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "insumo", schema = "pae")
public class InsumoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_insumo")
    private Long idInsumo;

    @Column(name = "nombre_insumo", nullable = false, length = 100)
    private String nombreInsumo;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    private String unidadMedida;

    @Column(name = "gramos_por_racion", nullable = false)
    private double gramosPorRacion;

    @Column(name = "stock_inicial_configurado", nullable = false)
    private double stockInicialConfigurado;

    @Column(name = "stock_reserva", nullable = false)
    private double stockReserva;

    @Column(name = "dias_entrega_proveedor", nullable = false)
    private int diasEntregaProveedor;

    protected InsumoEntity() {
    }

    public InsumoEntity(Long idInsumo, String nombreInsumo, String unidadMedida, double gramosPorRacion,
                         double stockInicialConfigurado, double stockReserva, int diasEntregaProveedor) {
        this.idInsumo = idInsumo;
        this.nombreInsumo = nombreInsumo;
        this.unidadMedida = unidadMedida;
        this.gramosPorRacion = gramosPorRacion;
        this.stockInicialConfigurado = stockInicialConfigurado;
        this.stockReserva = stockReserva;
        this.diasEntregaProveedor = diasEntregaProveedor;
    }

    public Long getIdInsumo() {
        return idInsumo;
    }

    public void setIdInsumo(Long idInsumo) {
        this.idInsumo = idInsumo;
    }

    public String getNombreInsumo() {
        return nombreInsumo;
    }

    public void setNombreInsumo(String nombreInsumo) {
        this.nombreInsumo = nombreInsumo;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public void setUnidadMedida(String unidadMedida) {
        this.unidadMedida = unidadMedida;
    }

    public double getGramosPorRacion() {
        return gramosPorRacion;
    }

    public void setGramosPorRacion(double gramosPorRacion) {
        this.gramosPorRacion = gramosPorRacion;
    }

    public double getStockInicialConfigurado() {
        return stockInicialConfigurado;
    }

    public void setStockInicialConfigurado(double stockInicialConfigurado) {
        this.stockInicialConfigurado = stockInicialConfigurado;
    }

    public double getStockReserva() {
        return stockReserva;
    }

    public void setStockReserva(double stockReserva) {
        this.stockReserva = stockReserva;
    }

    public int getDiasEntregaProveedor() {
        return diasEntregaProveedor;
    }

    public void setDiasEntregaProveedor(int diasEntregaProveedor) {
        this.diasEntregaProveedor = diasEntregaProveedor;
    }
}
