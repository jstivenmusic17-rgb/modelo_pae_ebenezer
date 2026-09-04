package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.JornadaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JornadaJpaRepository extends JpaRepository<JornadaEntity, Long> {
}
