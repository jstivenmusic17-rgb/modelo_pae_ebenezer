package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.EstudianteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstudianteJpaRepository extends JpaRepository<EstudianteEntity, Long> {
    long countByIdCurso(Long idCurso);

    List<EstudianteEntity> findByIdCurso(Long idCurso);
}
