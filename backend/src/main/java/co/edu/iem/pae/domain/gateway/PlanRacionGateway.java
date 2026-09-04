package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.PlanRacion;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlanRacionGateway {
    PlanRacion guardar(PlanRacion planRacion);

    Optional<PlanRacion> buscarPorId(Long idPlan);

    List<PlanRacion> listarPorCurso(Long idCurso);

    List<PlanRacion> listarPorFecha(LocalDate fecha);

    List<PlanRacion> listarPorCursoYRangoFechas(Long idCurso, LocalDate desde, LocalDate hasta);
}
