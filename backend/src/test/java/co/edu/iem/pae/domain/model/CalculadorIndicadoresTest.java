package co.edu.iem.pae.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Reproduce los ejemplos numericos del documento del proyecto (seccion 3.1)
class CalculadorIndicadoresTest {
    @Test
    void desperdicioF3() {
        assertEquals(2.07, CalculadorIndicadores.tasaDesperdicio(15, 725), 0.01);
    }

    @Test
    void consumoInsumoF10() {
        assertEquals(58.0, CalculadorIndicadores.consumoDiarioInsumoKg(725, 80), 1e-9);
    }

    @Test
    void puntoReordenF12() {
        assertEquals(194.0, CalculadorIndicadores.puntoReordenKg(58, 3, 20), 1e-9);
    }

    @Test
    void capacidadCocinaF19() {
        assertEquals(750.0, CalculadorIndicadores.capacidadMaximaCocina(150, 5), 1e-9);
    }
}
