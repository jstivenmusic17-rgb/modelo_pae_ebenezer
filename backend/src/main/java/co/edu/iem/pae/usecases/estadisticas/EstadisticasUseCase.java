package co.edu.iem.pae.usecases.estadisticas;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.CalculadorIndicadores;
import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.domain.model.EntregaRacion;
import co.edu.iem.pae.domain.model.EstadisticasResumen;
import co.edu.iem.pae.domain.model.IndicadoresOperativos;
import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.domain.model.ResumenPeriodo;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class EstadisticasUseCase {
    private final CursoGateway cursoGateway;
    private final PlanRacionGateway planRacionGateway;
    private final EntregaRacionGateway entregaRacionGateway;
    private final EstudianteGateway estudianteGateway;

    public EstadisticasUseCase(CursoGateway cursoGateway,
                                PlanRacionGateway planRacionGateway,
                                EntregaRacionGateway entregaRacionGateway,
                                EstudianteGateway estudianteGateway) {
        this.cursoGateway = cursoGateway;
        this.planRacionGateway = planRacionGateway;
        this.entregaRacionGateway = entregaRacionGateway;
        this.estudianteGateway = estudianteGateway;
    }

    public EstadisticasResumen obtenerEstadisticasPorCurso(Long idCurso) {
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));

        List<PlanRacion> planes = planRacionGateway.listarPorCurso(idCurso);
        return calcularResumen(planes);
    }

    public EstadisticasResumen obtenerEstadisticasPorJornada(Long idJornada) {
        List<Curso> cursos = cursoGateway.listarPorJornada(idJornada);
        if (cursos.isEmpty()) {
            throw new RecursoNoEncontradoException("No existen cursos para la jornada con id " + idJornada);
        }

        List<PlanRacion> planes = cursos.stream()
                .flatMap(curso -> planRacionGateway.listarPorCurso(curso.getIdCurso()).stream())
                .toList();

        return calcularResumen(planes);
    }

    private EstadisticasResumen calcularResumen(List<PlanRacion> planes) {
        long totalPlanes = planes.size();
        long totalPlanificadas = 0;
        long totalServidas = 0;
        long totalSobrantes = 0;
        long totalFaltantes = 0;
        double costoTotalSobrante = 0;
        double costoTotalFaltante = 0;

        for (PlanRacion plan : planes) {
            totalPlanificadas += plan.getRacionesPlanificadas();

            Optional<EntregaRacion> entregaOpcional = entregaRacionGateway.buscarPorPlan(plan.getIdPlan());
            if (entregaOpcional.isPresent()) {
                EntregaRacion entrega = entregaOpcional.get();
                totalServidas += entrega.getRacionesServidas();
                totalSobrantes += entrega.getRacionesSobrantes();
                totalFaltantes += entrega.getRacionesFaltantes();
                costoTotalSobrante += entrega.getRacionesSobrantes() * plan.getCostoSobranteUnitario();
                costoTotalFaltante += entrega.getRacionesFaltantes() * plan.getCostoFaltanteUnitario();
            }
        }

        return new EstadisticasResumen(
                totalPlanes,
                totalPlanificadas,
                totalServidas,
                totalSobrantes,
                totalFaltantes,
                costoTotalSobrante,
                costoTotalFaltante);
    }

    public IndicadoresOperativos calcularIndicadoresDiarios(Long idPlan, Double umbralCoberturaMinima) {
        PlanRacion plan = planRacionGateway.buscarPorId(idPlan)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el plan de racion con id " + idPlan));
        EntregaRacion entrega = entregaRacionGateway.buscarPorPlan(idPlan)
                .orElseThrow(() -> new RecursoNoEncontradoException("No hay entrega registrada para el plan con id " + idPlan));

        int demandaReal = entrega.getRacionesServidas() + entrega.getRacionesFaltantes();
        double umbralAUsar = umbralCoberturaMinima != null
                ? umbralCoberturaMinima
                : CalculadorIndicadores.UMBRAL_COBERTURA_MINIMA_DEFECTO;

        double tasaDesperdicio = CalculadorIndicadores.tasaDesperdicio(entrega.getRacionesSobrantes(), plan.getRacionesPlanificadas());
        double tasaFaltante = CalculadorIndicadores.tasaFaltante(entrega.getRacionesFaltantes(), demandaReal);
        double coberturaEfectiva = CalculadorIndicadores.coberturaEfectiva(entrega.getRacionesServidas(), plan.getMatriculaTotalRegistrada());
        double ausentismo = CalculadorIndicadores.porcentajeAusentismo(plan.getMatriculaTotalRegistrada(), entrega.getRacionesServidas());
        double rendimientoCocina = CalculadorIndicadores.rendimientoCocina(entrega.getRacionesServidas(), plan.getRacionesPlanificadas());

        return new IndicadoresOperativos(idPlan, tasaDesperdicio, tasaFaltante, coberturaEfectiva, ausentismo,
                rendimientoCocina, umbralAUsar);
    }

    public double calcularProporcionMatriculaPorJornada(Long idJornada) {
        List<Curso> cursosJornada = cursoGateway.listarPorJornada(idJornada);
        if (cursosJornada.isEmpty()) {
            throw new RecursoNoEncontradoException("No existen cursos para la jornada con id " + idJornada);
        }

        long matriculaJornada = cursosJornada.stream()
                .mapToLong(curso -> estudianteGateway.contarPorCurso(curso.getIdCurso()))
                .sum();

        long matriculaTotal = cursoGateway.listarTodos().stream()
                .mapToLong(curso -> estudianteGateway.contarPorCurso(curso.getIdCurso()))
                .sum();

        return CalculadorIndicadores.proporcionPorJornada(matriculaJornada, matriculaTotal);
    }

    public ResumenPeriodo calcularResumenPeriodo(Long idCurso, LocalDate desde, LocalDate hasta) {
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));

        List<PlanRacion> planes = planRacionGateway.listarPorCursoYRangoFechas(idCurso, desde, hasta);

        double costoTotalEjecutado = 0;
        double gastoTotalServido = 0;
        long totalRacionesServidas = 0;
        List<Integer> planificadas = new ArrayList<>();
        List<Integer> reales = new ArrayList<>();

        for (PlanRacion plan : planes) {
            costoTotalEjecutado += plan.getCostoTotalProduccion();

            Optional<EntregaRacion> entregaOpcional = entregaRacionGateway.buscarPorPlan(plan.getIdPlan());
            if (entregaOpcional.isPresent()) {
                EntregaRacion entrega = entregaOpcional.get();
                planificadas.add(plan.getRacionesPlanificadas());
                reales.add(entrega.getRacionesServidas());
                totalRacionesServidas += entrega.getRacionesServidas();
                gastoTotalServido += entrega.getRacionesServidas() * plan.getCostoProduccionUnitario();
            }
        }

        double costoPromedioPorRacion = CalculadorIndicadores.costoPromedioPorRacion(gastoTotalServido, totalRacionesServidas);
        double errorAbsolutoMedio = CalculadorIndicadores.errorAbsolutoMedio(planificadas, reales);

        return new ResumenPeriodo(planes.size(), costoTotalEjecutado, costoPromedioPorRacion, errorAbsolutoMedio);
    }

    public double calcularAhorroPorOptimizacion(Long idCurso,
                                                 LocalDate desdeAntes, LocalDate hastaAntes,
                                                 LocalDate desdeAhora, LocalDate hastaAhora) {
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));

        double promedioSobrantesAntes = promedioSobrantesDiarios(idCurso, desdeAntes, hastaAntes);
        List<PlanRacion> planesAhora = planRacionGateway.listarPorCursoYRangoFechas(idCurso, desdeAhora, hastaAhora);
        double promedioSobrantesAhora = promedioSobrantesDiarios(idCurso, desdeAhora, hastaAhora);

        double costoSobranteUnitarioPromedio = planesAhora.stream()
                .mapToDouble(PlanRacion::getCostoSobranteUnitario)
                .average()
                .orElse(0);

        long diasPeriodoAhora = java.time.temporal.ChronoUnit.DAYS.between(desdeAhora, hastaAhora) + 1;

        return CalculadorIndicadores.ahorroPorOptimizacion(promedioSobrantesAntes, promedioSobrantesAhora,
                diasPeriodoAhora, costoSobranteUnitarioPromedio);
    }

    private double promedioSobrantesDiarios(Long idCurso, LocalDate desde, LocalDate hasta) {
        List<PlanRacion> planes = planRacionGateway.listarPorCursoYRangoFechas(idCurso, desde, hasta);
        return planes.stream()
                .map(plan -> entregaRacionGateway.buscarPorPlan(plan.getIdPlan()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .mapToInt(EntregaRacion::getRacionesSobrantes)
                .average()
                .orElse(0);
    }
}
