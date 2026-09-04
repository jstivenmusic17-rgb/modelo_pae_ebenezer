package co.edu.iem.pae.infrastructure.entry_points.api_rest.dto;

import co.edu.iem.pae.domain.model.Curso;

public record CursoResponse(
        Long idCurso,
        String nombreCurso,
        Long idJornada
) {
    public static CursoResponse desde(Curso curso) {
        return new CursoResponse(curso.getIdCurso(), curso.getNombreCurso(), curso.getIdJornada());
    }
}
