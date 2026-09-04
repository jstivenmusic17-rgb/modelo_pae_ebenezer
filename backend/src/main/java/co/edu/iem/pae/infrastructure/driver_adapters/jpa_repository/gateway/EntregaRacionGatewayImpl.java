package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.EntregaRacion;
import co.edu.iem.pae.domain.model.PlanRacion;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.EntregaRacionEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.EntregaRacionJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class EntregaRacionGatewayImpl implements EntregaRacionGateway {

    private final EntregaRacionJpaRepository entregaRacionJpaRepository;
    private final PlanRacionGateway planRacionGateway;

    public EntregaRacionGatewayImpl(EntregaRacionJpaRepository entregaRacionJpaRepository,
                                     PlanRacionGateway planRacionGateway) {
        this.entregaRacionJpaRepository = entregaRacionJpaRepository;
        this.planRacionGateway = planRacionGateway;
    }

    @Override
    public EntregaRacion guardar(EntregaRacion entregaRacion) {
        EntregaRacionEntity entity = new EntregaRacionEntity(entregaRacion.getIdEntrega(), entregaRacion.getIdPlan(),
                entregaRacion.getRacionesServidas());
        EntregaRacionEntity entityGuardada = entregaRacionJpaRepository.save(entity);
        return aDominio(entityGuardada);
    }

    @Override
    public Optional<EntregaRacion> buscarPorPlan(Long idPlan) {
        return entregaRacionJpaRepository.findByIdPlan(idPlan).map(this::aDominio);
    }

    private EntregaRacion aDominio(EntregaRacionEntity entity) {
        PlanRacion plan = planRacionGateway.buscarPorId(entity.getIdPlan())
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el plan de racion con id " + entity.getIdPlan()));
        return EntregaRacion.calcularDesdeServidas(entity.getIdEntrega(), plan, entity.getRacionesServidas());
    }
}
