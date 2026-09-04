package co.edu.iem.pae.usecases.estudiante;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.model.Estudiante;

import java.util.List;

public class EstudianteUseCase {
    private final EstudianteGateway estudianteGateway;
    private final CursoGateway cursoGateway;

    public EstudianteUseCase(EstudianteGateway estudianteGateway, CursoGateway cursoGateway) {
        this.estudianteGateway = estudianteGateway;
        this.cursoGateway = cursoGateway;
    }

    public Estudiante matricularEstudiante(String documentoIdentidad, String nombreCompleto, Long idCurso) {
        if (documentoIdentidad == null || documentoIdentidad.isBlank()) {
            throw new IllegalArgumentException("El documento de identidad no puede estar vacio");
        }
        if (nombreCompleto == null || nombreCompleto.isBlank()) {
            throw new IllegalArgumentException("El nombre completo no puede estar vacio");
        }
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));

        Estudiante estudiante = new Estudiante(null, documentoIdentidad.trim(), nombreCompleto.trim(), idCurso);
        return estudianteGateway.guardar(estudiante);
    }

    public Estudiante actualizarEstudiante(Long idEstudiante, String documentoIdentidad, String nombreCompleto, Long idCurso) {
        consultarEstudiante(idEstudiante);
        if (documentoIdentidad == null || documentoIdentidad.isBlank()) {
            throw new IllegalArgumentException("El documento de identidad no puede estar vacio");
        }
        if (nombreCompleto == null || nombreCompleto.isBlank()) {
            throw new IllegalArgumentException("El nombre completo no puede estar vacio");
        }
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));

        Estudiante estudiante = new Estudiante(idEstudiante, documentoIdentidad.trim(), nombreCompleto.trim(), idCurso);
        return estudianteGateway.actualizar(estudiante);
    }

    public void eliminarEstudiante(Long idEstudiante) {
        consultarEstudiante(idEstudiante);
        estudianteGateway.eliminar(idEstudiante);
    }

    public Estudiante consultarEstudiante(Long idEstudiante) {
        return estudianteGateway.buscarPorId(idEstudiante)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el estudiante con id " + idEstudiante));
    }

    public List<Estudiante> listarEstudiantesPorCurso(Long idCurso) {
        cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));
        return estudianteGateway.listarPorCurso(idCurso);
    }
}
