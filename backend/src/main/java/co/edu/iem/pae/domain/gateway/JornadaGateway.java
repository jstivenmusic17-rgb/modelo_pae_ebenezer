package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.Jornada;

import java.util.List;
import java.util.Optional;

public interface JornadaGateway {
    Jornada guardar(Jornada jornada);

    Jornada actualizar(Jornada jornada);

    void eliminar(Long idJornada);

    Optional<Jornada> buscarPorId(Long idJornada);

    List<Jornada> listarTodas();
}
