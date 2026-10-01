package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.ParametrosModeloEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ParametrosModeloJpaRepository extends JpaRepository<ParametrosModeloEntity, Long> {
}
