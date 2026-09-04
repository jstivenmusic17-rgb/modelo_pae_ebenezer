package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.PlanRacionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface PlanRacionJpaRepository extends JpaRepository<PlanRacionEntity, Long> {
    List<PlanRacionEntity> findByIdCurso(Long idCurso);

    List<PlanRacionEntity> findByFecha(LocalDate fecha);

    List<PlanRacionEntity> findByIdCursoAndFechaBetween(Long idCurso, LocalDate desde, LocalDate hasta);
}
