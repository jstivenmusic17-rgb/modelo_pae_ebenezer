package co.edu.iem.pae.usecases.plan;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.CalculadorDemanda;
import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.domain.model.ResultadoCalculoDemanda;

import java.time.LocalDate;
import java.util.List;

public class PlanRacionUseCase {
    private final CursoGateway cursoGateway;
    private final EstudianteGateway estudianteGateway;
    private final PlanRacionGateway planRacionGateway;

    public PlanRacionUseCase(CursoGateway cursoGateway,
                              EstudianteGateway estudianteGateway,
                              PlanRacionGateway planRacionGateway) {
        this.cursoGateway = cursoGateway;
        this.estudianteGateway = estudianteGateway;
        this.planRacionGateway = planRacionGateway;
    }

    public PlanRacion calcularYGuardarPlan(Long idCurso,
                                            LocalDate fecha,
                                            double tasaAsistenciaEstimada,
                                            double costoSobranteUnitario,
                                            double costoFaltanteUnitario,
                                            Double coeficienteVariacion,
                                            Double costoProduccionUnitario,
                                            Double margenSeguridad) {
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

        PlanRacion planCalculado = new PlanRacion(
                null,
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

    public List<PlanRacion> listarPlanesPorCurso(Long idCurso) {
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));
        return planRacionGateway.listarPorCurso(idCurso);
    }
}
