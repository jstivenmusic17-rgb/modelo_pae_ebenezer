package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.ParametrosModelo;

import java.util.Optional;

public interface ParametrosModeloGateway {
    Optional<ParametrosModelo> obtener();

    ParametrosModelo guardar(ParametrosModelo parametros);
}
