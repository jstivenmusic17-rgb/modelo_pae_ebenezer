package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.InsumoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsumoJpaRepository extends JpaRepository<InsumoEntity, Long> {
}
