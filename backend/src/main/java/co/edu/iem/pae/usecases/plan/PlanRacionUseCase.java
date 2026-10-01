package co.edu.iem.pae.usecases.plan;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.CalculadorDemanda;
import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.domain.model.ResultadoCalculoDemanda;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PlanRacionUseCase {
    private final CursoGateway cursoGateway;
    private final EstudianteGateway estudianteGateway;
    private final PlanRacionGateway planRacionGateway;
    private final EntregaRacionGateway entregaRacionGateway;

    public PlanRacionUseCase(CursoGateway cursoGateway,
                              EstudianteGateway estudianteGateway,
                              PlanRacionGateway planRacionGateway,
                              EntregaRacionGateway entregaRacionGateway) {
        this.cursoGateway = cursoGateway;
        this.estudianteGateway = estudianteGateway;
        this.planRacionGateway = planRacionGateway;
        this.entregaRacionGateway = entregaRacionGateway;
    }

    public PlanRacion calcularYGuardarPlan(Long idCurso,
                                            LocalDate fecha,
                                            double tasaAsistenciaEstimada,
                                            double costoSobranteUnitario,
                                            double costoFaltanteUnitario,
                                            Double coeficienteVariacion,
                                            Double costoProduccionUnitario,
                                            Double margenSeguridad) {
        if (fecha.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("La fecha del plan no puede ser anterior a hoy");
        }

        Curso curso = cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));

        long matriculaTotal = estudianteGateway.contarPorCurso(curso.getIdCurso());
        if (matriculaTotal == 0) {
            throw new IllegalArgumentException("El curso '" + curso.getNombreCurso() + "' no tiene estudiantes matriculados");
        }

        double coeficienteVariacionAUsar = coeficienteVariacion != null
                ? coeficienteVariacion
                : CalculadorDemanda.COEFICIENTE_VARIACION_DEFECTO;
        double costoProduccionUnitarioAUsar = costoProduccionUnitario != null ? costoProduccionUnitario : 0;
        double margenSeguridadAUsar = margenSeguridad != null ? margenSeguridad : 0.007;

        ResultadoCalculoDemanda resultado = CalculadorDemanda.calcular(
                matriculaTotal,
                tasaAsistenciaEstimada,
                costoSobranteUnitario,
                costoFaltanteUnitario,
                coeficienteVariacionAUsar);

        // Recalcular el mismo curso y fecha reemplaza el plan anterior en vez
        // de duplicarlo, salvo que el comedor de ese plan ya se haya registrado.
        Long idPlanExistente = planRacionGateway.buscarPorCursoYFecha(curso.getIdCurso(), fecha)
                .map(existente -> {
                    if (entregaRacionGateway.buscarPorPlan(existente.getIdPlan()).isPresent()) {
                        throw new IllegalArgumentException("El curso '" + curso.getNombreCurso()
                                + "' ya tiene el comedor registrado para " + fecha
                                + "; no se puede recalcular su plan");
                    }
                    return existente.getIdPlan();
                })
                .orElse(null);

        PlanRacion planCalculado = new PlanRacion(
                idPlanExistente,
                fecha,
                curso.getIdCurso(),
                matriculaTotal,
                tasaAsistenciaEstimada,
                resultado.getPedidoOptimo(),
                costoSobranteUnitario,
                costoFaltanteUnitario,
                costoProduccionUnitarioAUsar,
                margenSeguridadAUsar);

        return planRacionGateway.guardar(planCalculado);
    }

    public PlanRacion consultarPlan(Long idPlan) {
        return planRacionGateway.buscarPorId(idPlan)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el plan de racion con id " + idPlan));
    }

    // Un plan vigente por curso: si hay duplicados historicos, gana el mas reciente
    public List<PlanRacion> listarPlanesPorFecha(LocalDate fecha) {
        Map<Long, PlanRacion> vigentePorCurso = new HashMap<>();
        for (PlanRacion plan : planRacionGateway.listarPorFecha(fecha)) {
            vigentePorCurso.merge(plan.getIdCurso(), plan,
                    (a, b) -> a.getIdPlan() > b.getIdPlan() ? a : b);
        }
        return new ArrayList<>(vigentePorCurso.values());
    }

    public List<PlanRacion> listarPlanesPorCurso(Long idCurso) {
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));
        return planRacionGateway.listarPorCurso(idCurso);
    }
}
