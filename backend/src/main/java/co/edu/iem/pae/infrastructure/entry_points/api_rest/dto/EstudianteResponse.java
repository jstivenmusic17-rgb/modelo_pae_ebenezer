package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.Estudiante;

public record EstudianteResponse(
        Long idEstudiante,
        String documentoIdentidad,
        String nombreCompleto,
        Long idCurso
) {
    public static EstudianteResponse desde(Estudiante estudiante) {
        return new EstudianteResponse(
                estudiante.getIdEstudiante(),
                estudiante.getDocumentoIdentidad(),
                estudiante.getNombreCompleto(),
                estudiante.getIdCurso());
    }
}
