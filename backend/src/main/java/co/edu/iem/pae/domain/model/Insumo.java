package co.edu.iem.pae.domain.model;

public class Insumo {

    private final Long idInsumo;
    private final String nombreInsumo;
    private final String unidadMedida;
    private final double gramosPorRacion;
    private final double stockInicialConfigurado;
    private final double stockReserva;
    private final int diasEntregaProveedor;

    public Insumo(Long idInsumo, String nombreInsumo, String unidadMedida, double gramosPorRacion,
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

    public String getNombreInsumo() {
        return nombreInsumo;
    }

    public String getUnidadMedida() {
        return unidadMedida;
    }

    public double getGramosPorRacion() {
        return gramosPorRacion;
    }

    public double getStockInicialConfigurado() {
        return stockInicialConfigurado;
    }

    public double getStockReserva() {
        return stockReserva;
    }

    public int getDiasEntregaProveedor() {
        return diasEntregaProveedor;
    }
}
