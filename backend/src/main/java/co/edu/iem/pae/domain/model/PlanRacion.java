package co.edu.iem.pae.domain.model;

import java.time.LocalDate;

public class PlanRacion {
    private final Long idPlan;
    private final LocalDate fecha;
    private final Long idCurso;
    private final long matriculaTotalRegistrada;
    private final double tasaAsistenciaEstimada;
    private final int racionesPlanificadas;
    private final double costoSobranteUnitario;
    private final double costoFaltanteUnitario;
    private final double costoProduccionUnitario;
    private final double margenSeguridadUsado;

    public PlanRacion(Long idPlan,
                       LocalDate fecha,
                       Long idCurso,
                       long matriculaTotalRegistrada,
                       double tasaAsistenciaEstimada,
                       int racionesPlanificadas,
                       double costoSobranteUnitario,
                       double costoFaltanteUnitario,
                       double costoProduccionUnitario,
                       double margenSeguridadUsado) {
        this.idPlan = idPlan;
        this.fecha = fecha;
        this.idCurso = idCurso;
        this.matriculaTotalRegistrada = matriculaTotalRegistrada;
        this.tasaAsistenciaEstimada = tasaAsistenciaEstimada;
        this.racionesPlanificadas = racionesPlanificadas;
        this.costoSobranteUnitario = costoSobranteUnitario;
        this.costoFaltanteUnitario = costoFaltanteUnitario;
        this.costoProduccionUnitario = costoProduccionUnitario;
        this.margenSeguridadUsado = margenSeguridadUsado;
    }

    public Long getIdPlan() {
        return idPlan;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public Long getIdCurso() {
        return idCurso;
    }

    public long getMatriculaTotalRegistrada() {
        return matriculaTotalRegistrada;
    }

    public double getTasaAsistenciaEstimada() {
        return tasaAsistenciaEstimada;
    }

    public int getRacionesPlanificadas() {
        return racionesPlanificadas;
    }

    public double getCostoSobranteUnitario() {
        return costoSobranteUnitario;
    }

    public double getCostoFaltanteUnitario() {
        return costoFaltanteUnitario;
    }

    public double getCostoProduccionUnitario() {
        return costoProduccionUnitario;
    }

    public double getMargenSeguridadUsado() {
        return margenSeguridadUsado;
    }

    public int getDemandaBase() {
        return CalculadorDemanda.calcularDemandaBase(matriculaTotalRegistrada, tasaAsistenciaEstimada);
    }

    public double getRazonCritica() {
        return CalculadorDemanda.calcularRazonCritica(costoFaltanteUnitario, costoSobranteUnitario);
    }

    public int getRacionesSugeridasMargen() {
        return CalculadorDemanda.calcularRacionesSugeridasMargen(getDemandaBase(), margenSeguridadUsado);
    }

    public double getCostoTotalProduccion() {
        return racionesPlanificadas * costoProduccionUnitario;
    }
}
