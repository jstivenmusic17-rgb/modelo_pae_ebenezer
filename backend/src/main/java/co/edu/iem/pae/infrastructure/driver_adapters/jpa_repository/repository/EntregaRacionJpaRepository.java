package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.EntregaRacionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EntregaRacionJpaRepository extends JpaRepository<EntregaRacionEntity, Long> {
    Optional<EntregaRacionEntity> findByIdPlan(Long idPlan);
}
