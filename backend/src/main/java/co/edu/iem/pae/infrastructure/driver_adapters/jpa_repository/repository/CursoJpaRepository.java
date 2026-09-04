package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.CursoEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CursoJpaRepository extends JpaRepository<CursoEntity, Long> {
    List<CursoEntity> findByIdJornada(Long idJornada);
}
