package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.PlanRacionEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.PlanRacionJpaRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class PlanRacionGatewayImpl implements PlanRacionGateway {
    private final PlanRacionJpaRepository planRacionJpaRepository;

    public PlanRacionGatewayImpl(PlanRacionJpaRepository planRacionJpaRepository) {
        this.planRacionJpaRepository = planRacionJpaRepository;
    }

    @Override
    public PlanRacion guardar(PlanRacion planRacion) {
        PlanRacionEntity entity = aEntidad(planRacion);
        PlanRacionEntity entityGuardada = planRacionJpaRepository.save(entity);
        return aDominio(entityGuardada);
    }

    @Override
    public Optional<PlanRacion> buscarPorId(Long idPlan) {
        return planRacionJpaRepository.findById(idPlan).map(this::aDominio);
    }

    @Override
    public List<PlanRacion> listarPorCurso(Long idCurso) {
        return planRacionJpaRepository.findByIdCurso(idCurso).stream().map(this::aDominio).toList();
    }

    @Override
    public List<PlanRacion> listarPorFecha(LocalDate fecha) {
        return planRacionJpaRepository.findByFecha(fecha).stream().map(this::aDominio).toList();
    }

    @Override
    public List<PlanRacion> listarPorCursoYRangoFechas(Long idCurso, LocalDate desde, LocalDate hasta) {
        return planRacionJpaRepository.findByIdCursoAndFechaBetween(idCurso, desde, hasta).stream().map(this::aDominio).toList();
    }

    private PlanRacionEntity aEntidad(PlanRacion plan) {
        return new PlanRacionEntity(
                plan.getIdPlan(),
                plan.getFecha(),
                plan.getIdCurso(),
                plan.getMatriculaTotalRegistrada(),
                plan.getTasaAsistenciaEstimada(),
                plan.getRacionesPlanificadas(),
                plan.getCostoSobranteUnitario(),
                plan.getCostoFaltanteUnitario(),
                plan.getCostoProduccionUnitario(),
                plan.getMargenSeguridadUsado());
    }

    private PlanRacion aDominio(PlanRacionEntity entity) {
        return new PlanRacion(
                entity.getIdPlan(),
                entity.getFecha(),
                entity.getIdCurso(),
                entity.getMatriculaTotalRegistrada(),
                entity.getTasaAsistenciaEstimada(),
                entity.getRacionesPlanificadas(),
                entity.getCostoSobranteUnitario(),
                entity.getCostoFaltanteUnitario(),
                entity.getCostoProduccionUnitario(),
                entity.getMargenSeguridadUsado());
    }
}
