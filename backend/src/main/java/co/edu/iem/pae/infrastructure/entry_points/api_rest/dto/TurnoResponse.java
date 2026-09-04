package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.Turno;

public record TurnoResponse(
        Long idTurno,
        String nombreTurno,
        double horasDuracion
) {
    public static TurnoResponse desde(Turno turno) {
        return new TurnoResponse(turno.getIdTurno(), turno.getNombreTurno(), turno.getHorasDuracion());
    }
}
