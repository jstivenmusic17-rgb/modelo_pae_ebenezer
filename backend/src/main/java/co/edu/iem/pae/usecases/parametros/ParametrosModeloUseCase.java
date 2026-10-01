package co.edu.iem.pae.usecases.parametros;

import co.edu.iem.pae.domain.gateway.ParametrosModeloGateway;
import co.edu.iem.pae.domain.model.ParametrosModelo;

public class ParametrosModeloUseCase {
    private final ParametrosModeloGateway parametrosModeloGateway;

    public ParametrosModeloUseCase(ParametrosModeloGateway parametrosModeloGateway) {
        this.parametrosModeloGateway = parametrosModeloGateway;
    }

    // Si aun no hay parametros guardados, se crean con los valores del documento
    public ParametrosModelo obtener() {
        return parametrosModeloGateway.obtener()
                .orElseGet(() -> parametrosModeloGateway.guardar(ParametrosModelo.porDefecto()));
    }

    public ParametrosModelo actualizar(ParametrosModelo parametros) {
        parametros.validar();
        return parametrosModeloGateway.guardar(parametros);
    }
}
