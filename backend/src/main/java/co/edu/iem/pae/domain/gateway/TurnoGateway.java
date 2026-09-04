package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.Turno;

import java.util.List;
import java.util.Optional;

public interface TurnoGateway {
    Turno guardar(Turno turno);

    Optional<Turno> buscarPorId(Long idTurno);

    List<Turno> listarTodos();
}
