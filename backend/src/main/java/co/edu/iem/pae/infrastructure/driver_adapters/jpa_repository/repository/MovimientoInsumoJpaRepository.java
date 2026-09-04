package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.MovimientoInsumoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovimientoInsumoJpaRepository extends JpaRepository<MovimientoInsumoEntity, Long> {

    List<MovimientoInsumoEntity> findByIdInsumoOrderByFechaAsc(Long idInsumo);

    Optional<MovimientoInsumoEntity> findFirstByIdInsumoOrderByFechaDesc(Long idInsumo);
}
