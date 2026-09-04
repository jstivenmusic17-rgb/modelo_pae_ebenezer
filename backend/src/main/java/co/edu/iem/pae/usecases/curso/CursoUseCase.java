package co.edu.iem.pae.usecases.curso;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.gateway.JornadaGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.Curso;

import java.util.List;

public class CursoUseCase {
    private final CursoGateway cursoGateway;
    private final JornadaGateway jornadaGateway;
    private final EstudianteGateway estudianteGateway;
    private final PlanRacionGateway planRacionGateway;

    public CursoUseCase(CursoGateway cursoGateway, JornadaGateway jornadaGateway,
                         EstudianteGateway estudianteGateway, PlanRacionGateway planRacionGateway) {
        this.cursoGateway = cursoGateway;
        this.jornadaGateway = jornadaGateway;
        this.estudianteGateway = estudianteGateway;
        this.planRacionGateway = planRacionGateway;
    }

    public Curso crearCurso(String nombreCurso, Long idJornada) {
        if (nombreCurso == null || nombreCurso.isBlank()) {
            throw new IllegalArgumentException("El nombre del curso no puede estar vacio");
        }
        jornadaGateway.buscarPorId(idJornada)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la jornada con id " + idJornada));

        Curso curso = new Curso(null, nombreCurso.trim(), idJornada);
        return cursoGateway.guardar(curso);
    }

    public Curso actualizarCurso(Long idCurso, String nombreCurso, Long idJornada) {
        consultarCurso(idCurso);
        if (nombreCurso == null || nombreCurso.isBlank()) {
            throw new IllegalArgumentException("El nombre del curso no puede estar vacio");
        }
        jornadaGateway.buscarPorId(idJornada)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la jornada con id " + idJornada));

        Curso curso = new Curso(idCurso, nombreCurso.trim(), idJornada);
        return cursoGateway.actualizar(curso);
    }

    public void eliminarCurso(Long idCurso) {
        consultarCurso(idCurso);

        if (!estudianteGateway.listarPorCurso(idCurso).isEmpty()) {
            throw new IllegalArgumentException(
                    "No se puede eliminar el curso con id " + idCurso + " porque tiene estudiantes matriculados");
        }
        if (!planRacionGateway.listarPorCurso(idCurso).isEmpty()) {
            throw new IllegalArgumentException(
                    "No se puede eliminar el curso con id " + idCurso + " porque tiene planes de racion asociados");
        }

        cursoGateway.eliminar(idCurso);
    }

    public Curso consultarCurso(Long idCurso) {
        return cursoGateway.buscarPorId(idCurso)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el curso con id " + idCurso));
    }

    public List<Curso> listarCursosPorJornada(Long idJornada) {
        jornadaGateway.buscarPorId(idJornada)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la jornada con id " + idJornada));
        return cursoGateway.listarPorJornada(idJornada);
    }

    public List<Curso> listarTodosLosCursos() {
        return cursoGateway.listarTodos();
    }
}
