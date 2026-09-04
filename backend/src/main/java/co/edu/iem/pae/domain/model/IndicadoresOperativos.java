package co.edu.iem.pae.domain.model;

public class IndicadoresOperativos {

    private final Long idPlan;
    private final double tasaDesperdicio;
    private final double tasaFaltante;
    private final double coberturaEfectiva;
    private final double porcentajeAusentismo;
    private final double rendimientoCocina;
    private final double umbralCoberturaMinima;

    public IndicadoresOperativos(Long idPlan, double tasaDesperdicio, double tasaFaltante,
                                  double coberturaEfectiva, double porcentajeAusentismo, double rendimientoCocina,
                                  double umbralCoberturaMinima) {
        this.idPlan = idPlan;
        this.tasaDesperdicio = tasaDesperdicio;
        this.tasaFaltante = tasaFaltante;
        this.coberturaEfectiva = coberturaEfectiva;
        this.porcentajeAusentismo = porcentajeAusentismo;
        this.rendimientoCocina = rendimientoCocina;
        this.umbralCoberturaMinima = umbralCoberturaMinima;
    }

    public Long getIdPlan() {
        return idPlan;
    }

    public double getTasaDesperdicio() {
        return tasaDesperdicio;
    }

    public double getTasaFaltante() {
        return tasaFaltante;
    }

    public double getCoberturaEfectiva() {
        return coberturaEfectiva;
    }

    public double getPorcentajeAusentismo() {
        return porcentajeAusentismo;
    }

    public double getRendimientoCocina() {
        return rendimientoCocina;
    }

    public double getUmbralCoberturaMinima() {
        return umbralCoberturaMinima;
    }

    public boolean isAlertaCoberturaBaja() {
        return coberturaEfectiva < umbralCoberturaMinima;
    }
}
