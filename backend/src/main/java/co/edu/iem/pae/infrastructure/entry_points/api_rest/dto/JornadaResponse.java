package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.Jornada;

public record JornadaResponse(
        Long idJornada,
        String nombreJornada
) {
    public static JornadaResponse desde(Jornada jornada) {
        return new JornadaResponse(jornada.getIdJornada(), jornada.getNombreJornada());
    }
}
