package co.edu.iem.pae.domain.model;

public class ResumenPeriodo {

    private final long diasConDatos;
    private final double costoTotalEjecutado;
    private final double costoPromedioPorRacion;
    private final double errorAbsolutoMedio;

    public ResumenPeriodo(long diasConDatos, double costoTotalEjecutado, double costoPromedioPorRacion,
                           double errorAbsolutoMedio) {
        this.diasConDatos = diasConDatos;
        this.costoTotalEjecutado = costoTotalEjecutado;
        this.costoPromedioPorRacion = costoPromedioPorRacion;
        this.errorAbsolutoMedio = errorAbsolutoMedio;
    }

    public long getDiasConDatos() {
        return diasConDatos;
    }

    public double getCostoTotalEjecutado() {
        return costoTotalEjecutado;
    }

    public double getCostoPromedioPorRacion() {
        return costoPromedioPorRacion;
    }

    public double getErrorAbsolutoMedio() {
        return errorAbsolutoMedio;
    }
}
