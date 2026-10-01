package co.edu.iem.pae.usecases.plan;

import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.domain.model.EntregaRacion;
import co.edu.iem.pae.domain.model.Estudiante;
import co.edu.iem.pae.domain.model.PlanRacion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PlanRacionUseCaseTest {
    private static final LocalDate HOY = LocalDate.now();

    private PlanesEnMemoria planes;
    private EntregasEnMemoria entregas;
    private PlanRacionUseCase useCase;

    @BeforeEach
    void preparar() {
        planes = new PlanesEnMemoria();
        entregas = new EntregasEnMemoria();
        useCase = new PlanRacionUseCase(new CursoUnico(), new MatriculaFija(40), planes, entregas);
    }

    @Test
    void recalcularMismoCursoYFecha_reemplazaElPlan() {
        PlanRacion primero = useCase.calcularYGuardarPlan(1L, HOY, 0.9, 3200, 5000, 0.1, 3200.0, 0.007);
        PlanRacion segundo = useCase.calcularYGuardarPlan(1L, HOY, 0.8, 3200, 5000, 0.1, 3200.0, 0.007);

        List<PlanRacion> delDia = useCase.listarPlanesPorFecha(HOY);
        assertEquals(1, delDia.size());
        assertEquals(primero.getIdPlan(), segundo.getIdPlan());
        assertEquals(0.8, delDia.get(0).getTasaAsistenciaEstimada());
    }

    @Test
    void recalcularConComedorRegistrado_falla() {
        PlanRacion plan = useCase.calcularYGuardarPlan(1L, HOY, 0.9, 3200, 5000, 0.1, 3200.0, 0.007);
        entregas.guardar(EntregaRacion.calcularDesdeServidas(null, plan, 35));

        IllegalArgumentException error = assertThrows(IllegalArgumentException.class,
                () -> useCase.calcularYGuardarPlan(1L, HOY, 0.8, 3200, 5000, 0.1, 3200.0, 0.007));
        assertTrue(error.getMessage().contains("comedor"));
    }

    @Test
    void listarPorFecha_conDuplicadosHistoricos_devuelveSoloElMasReciente() {
        planes.guardar(new PlanRacion(null, HOY, 1L, 40, 0.9, 38, 3200, 5000, 3200, 0.007));
        planes.guardar(new PlanRacion(null, HOY, 1L, 40, 0.7, 30, 3200, 5000, 3200, 0.007));

        List<PlanRacion> delDia = useCase.listarPlanesPorFecha(HOY);
        assertEquals(1, delDia.size());
        assertEquals(0.7, delDia.get(0).getTasaAsistenciaEstimada());
    }

    static class CursoUnico implements CursoGateway {
        private final Curso curso = new Curso(1L, "6A", 1L);

        public Curso guardar(Curso c) { return c; }
        public Curso actualizar(Curso c) { return c; }
        public void eliminar(Long idCurso) { }
        public Optional<Curso> buscarPorId(Long idCurso) { return idCurso == 1L ? Optional.of(curso) : Optional.empty(); }
        public List<Curso> listarPorJornada(Long idJornada) { return List.of(curso); }
        public List<Curso> listarTodos() { return List.of(curso); }
    }

    static class MatriculaFija implements EstudianteGateway {
        private final long matricula;

        MatriculaFija(long matricula) { this.matricula = matricula; }

        public Estudiante guardar(Estudiante e) { return e; }
        public Estudiante actualizar(Estudiante e) { return e; }
        public void eliminar(Long idEstudiante) { }
        public Optional<Estudiante> buscarPorId(Long idEstudiante) { return Optional.empty(); }
        public long contarPorCurso(Long idCurso) { return matricula; }
        public List<Estudiante> listarPorCurso(Long idCurso) { return List.of(); }
    }

    static class PlanesEnMemoria implements PlanRacionGateway {
        private final Map<Long, PlanRacion> porId = new HashMap<>();
        private long secuencia = 0;

        public PlanRacion guardar(PlanRacion p) {
            Long id = p.getIdPlan() != null ? p.getIdPlan() : ++secuencia;
            PlanRacion guardado = new PlanRacion(id, p.getFecha(), p.getIdCurso(), p.getMatriculaTotalRegistrada(),
                    p.getTasaAsistenciaEstimada(), p.getRacionesPlanificadas(), p.getCostoSobranteUnitario(),
                    p.getCostoFaltanteUnitario(), p.getCostoProduccionUnitario(), p.getMargenSeguridadUsado());
            porId.put(id, guardado);
            return guardado;
        }

        public Optional<PlanRacion> buscarPorId(Long idPlan) { return Optional.ofNullable(porId.get(idPlan)); }

        public List<PlanRacion> listarPorCurso(Long idCurso) {
            return porId.values().stream().filter(p -> p.getIdCurso().equals(idCurso)).toList();
        }

        public List<PlanRacion> listarPorFecha(LocalDate fecha) {
            return porId.values().stream().filter(p -> p.getFecha().equals(fecha)).toList();
        }

        public List<PlanRacion> listarPorCursoYRangoFechas(Long idCurso, LocalDate desde, LocalDate hasta) {
            return new ArrayList<>(porId.values().stream()
                    .filter(p -> p.getIdCurso().equals(idCurso))
                    .filter(p -> !p.getFecha().isBefore(desde) && !p.getFecha().isAfter(hasta))
                    .toList());
        }

        public Optional<PlanRacion> buscarPorCursoYFecha(Long idCurso, LocalDate fecha) {
            return listarPorCursoYRangoFechas(idCurso, fecha, fecha).stream()
                    .max((a, b) -> Long.compare(a.getIdPlan(), b.getIdPlan()));
        }
    }

    static class EntregasEnMemoria implements EntregaRacionGateway {
        private final Map<Long, EntregaRacion> porPlan = new HashMap<>();

        public EntregaRacion guardar(EntregaRacion e) {
            porPlan.put(e.getIdPlan(), e);
            return e;
        }

        public Optional<EntregaRacion> buscarPorPlan(Long idPlan) { return Optional.ofNullable(porPlan.get(idPlan)); }
    }
}
