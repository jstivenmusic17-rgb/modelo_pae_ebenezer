package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.PersonalCocina;

import java.util.List;
import java.util.Optional;

public interface PersonalCocinaGateway {
    PersonalCocina guardar(PersonalCocina personal);

    Optional<PersonalCocina> buscarPorId(Long idPersonal);

    List<PersonalCocina> listarPorTurno(Long idTurno);

    List<PersonalCocina> listarTodos();
}
