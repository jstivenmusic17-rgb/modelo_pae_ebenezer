package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.PlanRacion;

import java.time.LocalDate;

public record PlanRacionResponse(
        Long idPlan,
        LocalDate fecha,
        Long idCurso,
        long matriculaTotalRegistrada,
        double tasaAsistenciaEstimada,
        int demandaBase,
        int racionesPlanificadas,
        double costoSobranteUnitario,
        double costoFaltanteUnitario,
        double razonCritica,
        double costoProduccionUnitario,
        double costoTotalProduccion,
        double margenSeguridadUsado,
        int racionesSugeridasMargen
) {
    public static PlanRacionResponse desde(PlanRacion plan) {
        return new PlanRacionResponse(
                plan.getIdPlan(),
                plan.getFecha(),
                plan.getIdCurso(),
                plan.getMatriculaTotalRegistrada(),
                plan.getTasaAsistenciaEstimada(),
                plan.getDemandaBase(),
                plan.getRacionesPlanificadas(),
                plan.getCostoSobranteUnitario(),
                plan.getCostoFaltanteUnitario(),
                plan.getRazonCritica(),
                plan.getCostoProduccionUnitario(),
                plan.getCostoTotalProduccion(),
                plan.getMargenSeguridadUsado(),
                plan.getRacionesSugeridasMargen());
    }
}
