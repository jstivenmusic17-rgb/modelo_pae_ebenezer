package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.IndicadoresResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ResumenPeriodoResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ValorCalculadoResponse;
import co.edu.iem.pae.usecases.estadisticas.EstadisticasUseCase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/pae/indicadores")
public class IndicadoresController {

    private final EstadisticasUseCase estadisticasUseCase;

    public IndicadoresController(EstadisticasUseCase estadisticasUseCase) {
        this.estadisticasUseCase = estadisticasUseCase;
    }

    @GetMapping("/plan/{idPlan}")
    public ResponseEntity<IndicadoresResponse> indicadoresDiarios(@PathVariable Long idPlan,
                                                                    @RequestParam(value = "umbralCobertura", required = false) Double umbralCobertura) {
        var indicadores = estadisticasUseCase.calcularIndicadoresDiarios(idPlan, umbralCobertura);
        return ResponseEntity.ok(IndicadoresResponse.desde(indicadores));
    }

    @GetMapping("/jornada/{idJornada}/proporcion-matricula")
    public ResponseEntity<ValorCalculadoResponse> proporcionPorJornada(@PathVariable Long idJornada) {
        double proporcion = estadisticasUseCase.calcularProporcionMatriculaPorJornada(idJornada);
        return ResponseEntity.ok(new ValorCalculadoResponse("proporcionMatriculaPorcentaje", proporcion));
    }

    @GetMapping("/curso/{idCurso}/resumen-periodo")
    public ResponseEntity<ResumenPeriodoResponse> resumenPeriodo(@PathVariable Long idCurso,
                                                                   @RequestParam("desde") LocalDate desde,
                                                                   @RequestParam("hasta") LocalDate hasta) {
        var resumen = estadisticasUseCase.calcularResumenPeriodo(idCurso, desde, hasta);
        return ResponseEntity.ok(ResumenPeriodoResponse.desde(resumen));
    }

    @GetMapping("/curso/{idCurso}/ahorro-optimizacion")
    public ResponseEntity<ValorCalculadoResponse> ahorroPorOptimizacion(@PathVariable Long idCurso,
                                                                          @RequestParam("desdeAntes") LocalDate desdeAntes,
                                                                          @RequestParam("hastaAntes") LocalDate hastaAntes,
                                                                          @RequestParam("desdeAhora") LocalDate desdeAhora,
                                                                          @RequestParam("hastaAhora") LocalDate hastaAhora) {
        double ahorro = estadisticasUseCase.calcularAhorroPorOptimizacion(idCurso, desdeAntes, hastaAntes, desdeAhora, hastaAhora);
        return ResponseEntity.ok(new ValorCalculadoResponse("ahorroEstimado", ahorro));
    }
}
