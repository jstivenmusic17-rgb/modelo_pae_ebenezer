package co.edu.iem.pae.domain.model;

public class EntregaRacion {
    private final Long idEntrega;
    private final Long idPlan;
    private final int racionesServidas;
    private final int racionesSobrantes;
    private final int racionesFaltantes;
    private final double costoTotalDesviacion;

    public EntregaRacion(Long idEntrega,
                          Long idPlan,
                          int racionesServidas,
                          int racionesSobrantes,
                          int racionesFaltantes,
                          double costoTotalDesviacion) {
        this.idEntrega = idEntrega;
        this.idPlan = idPlan;
        this.racionesServidas = racionesServidas;
        this.racionesSobrantes = racionesSobrantes;
        this.racionesFaltantes = racionesFaltantes;
        this.costoTotalDesviacion = costoTotalDesviacion;
    }

    public static EntregaRacion calcularDesdeServidas(Long idEntrega, PlanRacion plan, int racionesServidas) {
        int sobrantes = Math.max(0, plan.getRacionesPlanificadas() - racionesServidas);
        int faltantes = Math.max(0, racionesServidas - plan.getRacionesPlanificadas());
        double costoTotalDesviacion = (sobrantes * plan.getCostoSobranteUnitario())
                + (faltantes * plan.getCostoFaltanteUnitario());
        return new EntregaRacion(idEntrega, plan.getIdPlan(), racionesServidas, sobrantes, faltantes, costoTotalDesviacion);
    }

    public Long getIdEntrega() {
        return idEntrega;
    }

    public Long getIdPlan() {
        return idPlan;
    }

    public int getRacionesServidas() {
        return racionesServidas;
    }

    public int getRacionesSobrantes() {
        return racionesSobrantes;
    }

    public int getRacionesFaltantes() {
        return racionesFaltantes;
    }

    public double getCostoTotalDesviacion() {
        return costoTotalDesviacion;
    }
}
