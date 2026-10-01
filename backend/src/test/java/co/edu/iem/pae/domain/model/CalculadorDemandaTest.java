package co.edu.iem.pae.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

// Reproduce los ejemplos numericos del documento del proyecto (seccion 3.1)
class CalculadorDemandaTest {
    @Test
    void demandaBaseF1_ejemploDocumento() {
        assertEquals(720, CalculadorDemanda.calcularDemandaBase(800, 0.90));
    }

    @Test
    void margenF2_ejemploDocumento() {
        assertEquals(725, CalculadorDemanda.calcularRacionesSugeridasMargen(720, 0.007));
    }

    @Test
    void razonCritica_faltanteMasCaroQueSobrante_superaMitad() {
        double razonCritica = CalculadorDemanda.calcularRazonCritica(5000, 3200);
        assertEquals(5000.0 / 8200.0, razonCritica, 1e-9);
        assertTrue(razonCritica > 0.5);
    }

    @Test
    void pedidoOptimo_pideMasQueLaDemandaCuandoFaltarCuestaMas() {
        ResultadoCalculoDemanda resultado = CalculadorDemanda.calcular(455, 0.90, 3200, 5000, 0.10);
        assertEquals(410, resultado.getDemandaBase());
        assertTrue(resultado.getPedidoOptimo() > 410);
        assertEquals(Math.round(410 + resultado.getZScore() * 41.0), resultado.getPedidoOptimo());
    }

    @Test
    void asistenciaFueraDeRango_seRechaza() {
        assertThrows(IllegalArgumentException.class, () -> CalculadorDemanda.calcularDemandaBase(800, 1.5));
    }
}
