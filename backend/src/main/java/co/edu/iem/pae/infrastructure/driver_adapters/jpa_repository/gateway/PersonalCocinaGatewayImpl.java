package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.PersonalCocinaGateway;
import co.edu.iem.pae.domain.model.PersonalCocina;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.PersonalCocinaEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.PersonalCocinaJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class PersonalCocinaGatewayImpl implements PersonalCocinaGateway {

    private final PersonalCocinaJpaRepository personalCocinaJpaRepository;

    public PersonalCocinaGatewayImpl(PersonalCocinaJpaRepository personalCocinaJpaRepository) {
        this.personalCocinaJpaRepository = personalCocinaJpaRepository;
    }

    @Override
    public PersonalCocina guardar(PersonalCocina personal) {
        PersonalCocinaEntity entity = new PersonalCocinaEntity(personal.getIdPersonal(), personal.getNombreCompleto(),
                personal.getRacionesPorHoraCapacidad(), personal.getIdTurno());
        return aDominio(personalCocinaJpaRepository.save(entity));
    }

    @Override
    public Optional<PersonalCocina> buscarPorId(Long idPersonal) {
        return personalCocinaJpaRepository.findById(idPersonal).map(this::aDominio);
    }

    @Override
    public List<PersonalCocina> listarPorTurno(Long idTurno) {
        return personalCocinaJpaRepository.findByIdTurno(idTurno).stream().map(this::aDominio).toList();
    }

    @Override
    public List<PersonalCocina> listarTodos() {
        return personalCocinaJpaRepository.findAll().stream().map(this::aDominio).toList();
    }

    private PersonalCocina aDominio(PersonalCocinaEntity entity) {
        return new PersonalCocina(entity.getIdPersonal(), entity.getNombreCompleto(),
                entity.getRacionesPorHoraCapacidad(), entity.getIdTurno());
    }
}
