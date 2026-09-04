package co.edu.iem.pae.domain.model;

public class EstadisticasResumen {
    private final long totalPlanes;
    private final long totalRacionesPlanificadas;
    private final long totalRacionesServidas;
    private final long totalRacionesSobrantes;
    private final long totalRacionesFaltantes;
    private final double costoTotalSobrante;
    private final double costoTotalFaltante;

    public EstadisticasResumen(long totalPlanes,
                                long totalRacionesPlanificadas,
                                long totalRacionesServidas,
                                long totalRacionesSobrantes,
                                long totalRacionesFaltantes,
                                double costoTotalSobrante,
                                double costoTotalFaltante) {
        this.totalPlanes = totalPlanes;
        this.totalRacionesPlanificadas = totalRacionesPlanificadas;
        this.totalRacionesServidas = totalRacionesServidas;
        this.totalRacionesSobrantes = totalRacionesSobrantes;
        this.totalRacionesFaltantes = totalRacionesFaltantes;
        this.costoTotalSobrante = costoTotalSobrante;
        this.costoTotalFaltante = costoTotalFaltante;
    }

    public long getTotalPlanes() {
        return totalPlanes;
    }

    public long getTotalRacionesPlanificadas() {
        return totalRacionesPlanificadas;
    }

    public long getTotalRacionesServidas() {
        return totalRacionesServidas;
    }

    public long getTotalRacionesSobrantes() {
        return totalRacionesSobrantes;
    }

    public long getTotalRacionesFaltantes() {
        return totalRacionesFaltantes;
    }

    public double getCostoTotalSobrante() {
        return costoTotalSobrante;
    }

    public double getCostoTotalFaltante() {
        return costoTotalFaltante;
    }

    public double getCostoTotal() {
        return costoTotalSobrante + costoTotalFaltante;
    }
}
