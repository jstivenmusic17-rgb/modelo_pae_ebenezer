package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.TurnoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TurnoJpaRepository extends JpaRepository<TurnoEntity, Long> {
}
