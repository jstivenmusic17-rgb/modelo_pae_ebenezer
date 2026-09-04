package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository;

import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.PersonalCocinaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonalCocinaJpaRepository extends JpaRepository<PersonalCocinaEntity, Long> {

    List<PersonalCocinaEntity> findByIdTurno(Long idTurno);
}
