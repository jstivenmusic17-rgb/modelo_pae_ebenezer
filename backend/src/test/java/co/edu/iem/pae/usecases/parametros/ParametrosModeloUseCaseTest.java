package co.edu.iem.pae.usecases.parametros;

import co.edu.iem.pae.domain.gateway.ParametrosModeloGateway;
import co.edu.iem.pae.domain.model.ParametrosModelo;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ParametrosModeloUseCaseTest {
    static class GatewayEnMemoria implements ParametrosModeloGateway {
        ParametrosModelo guardado;

        @Override
        public Optional<ParametrosModelo> obtener() {
            return Optional.ofNullable(guardado);
        }

        @Override
        public ParametrosModelo guardar(ParametrosModelo parametros) {
            guardado = parametros;
            return parametros;
        }
    }

    @Test
    void sinRegistro_creaValoresDelDocumento() {
        GatewayEnMemoria gateway = new GatewayEnMemoria();
        ParametrosModelo parametros = new ParametrosModeloUseCase(gateway).obtener();
        assertEquals(3200, parametros.getCostoProduccionUnitario());
        assertEquals(5000, parametros.getCostoFaltanteUnitario());
        assertEquals(3200, parametros.getCostoSobranteUnitario());
        assertEquals(0.10, parametros.getCoeficienteVariacion());
        assertEquals(0.007, parametros.getMargenSeguridadReferencia());
        assertEquals(0.90, parametros.getTasaAsistenciaDefecto());
        assertNotNull(gateway.guardado);
    }

    @Test
    void costoNegativo_seRechazaSinGuardar() {
        GatewayEnMemoria gateway = new GatewayEnMemoria();
        ParametrosModeloUseCase useCase = new ParametrosModeloUseCase(gateway);
        assertThrows(IllegalArgumentException.class,
                () -> useCase.actualizar(new ParametrosModelo(-1, 5000, 3200, 0.1, 0.007, 0.9)));
        assertNull(gateway.guardado);
    }

    @Test
    void asistenciaFueraDeRango_seRechaza() {
        ParametrosModeloUseCase useCase = new ParametrosModeloUseCase(new GatewayEnMemoria());
        assertThrows(IllegalArgumentException.class,
                () -> useCase.actualizar(new ParametrosModelo(3200, 5000, 3200, 0.1, 0.007, 1.2)));
        assertThrows(IllegalArgumentException.class,
                () -> useCase.actualizar(new ParametrosModelo(3200, 5000, 3200, 0.1, 0.007, 0.3)));
    }
}
