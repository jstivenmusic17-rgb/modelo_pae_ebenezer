package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.PersonalCocina;

public record PersonalCocinaResponse(
        Long idPersonal,
        String nombreCompleto,
        double racionesPorHoraCapacidad,
        Long idTurno
) {
    public static PersonalCocinaResponse desde(PersonalCocina personal) {
        return new PersonalCocinaResponse(personal.getIdPersonal(), personal.getNombreCompleto(),
                personal.getRacionesPorHoraCapacidad(), personal.getIdTurno());
    }
}
