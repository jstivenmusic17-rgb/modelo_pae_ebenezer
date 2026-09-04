package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CalcularPlanRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.EstadisticasResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.PlanRacionResponse;
import co.edu.iem.pae.usecases.estadisticas.EstadisticasUseCase;
import co.edu.iem.pae.usecases.plan.PlanRacionUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pae/plan")
public class PlanRacionController {
    private final PlanRacionUseCase planRacionUseCase;
    private final EstadisticasUseCase estadisticasUseCase;

    public PlanRacionController(PlanRacionUseCase planRacionUseCase, EstadisticasUseCase estadisticasUseCase) {
        this.planRacionUseCase = planRacionUseCase;
        this.estadisticasUseCase = estadisticasUseCase;
    }

    @PostMapping("/calcular")
    public ResponseEntity<PlanRacionResponse> calcularPlan(@Valid @RequestBody CalcularPlanRequest request) {
        PlanRacion plan = planRacionUseCase.calcularYGuardarPlan(
                request.idCurso(),
                request.fecha(),
                request.tasaAsistenciaEstimada(),
                request.costoSobranteUnitario(),
                request.costoFaltanteUnitario(),
                request.coeficienteVariacion(),
                request.costoProduccionUnitario(),
                request.margenSeguridad());

        return ResponseEntity.status(HttpStatus.CREATED).body(PlanRacionResponse.desde(plan));
    }

    @GetMapping("/{idPlan}")
    public ResponseEntity<PlanRacionResponse> consultarPlan(@PathVariable Long idPlan) {
        PlanRacion plan = planRacionUseCase.consultarPlan(idPlan);
        return ResponseEntity.ok(PlanRacionResponse.desde(plan));
    }

    @GetMapping("/curso/{idCurso}")
    public ResponseEntity<List<PlanRacionResponse>> listarPorCurso(@PathVariable Long idCurso) {
        List<PlanRacionResponse> planes = planRacionUseCase.listarPlanesPorCurso(idCurso).stream()
                .map(PlanRacionResponse::desde)
                .toList();
        return ResponseEntity.ok(planes);
    }

    @GetMapping("/curso/{idCurso}/estadisticas")
    public ResponseEntity<EstadisticasResponse> estadisticasPorCurso(@PathVariable Long idCurso) {
        var resumen = estadisticasUseCase.obtenerEstadisticasPorCurso(idCurso);
        return ResponseEntity.ok(EstadisticasResponse.desde(resumen));
    }

    @GetMapping("/jornada/{idJornada}/estadisticas")
    public ResponseEntity<EstadisticasResponse> estadisticasPorJornada(@PathVariable Long idJornada) {
        var resumen = estadisticasUseCase.obtenerEstadisticasPorJornada(idJornada);
        return ResponseEntity.ok(EstadisticasResponse.desde(resumen));
    }
}
