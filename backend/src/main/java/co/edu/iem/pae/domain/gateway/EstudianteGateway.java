package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.Estudiante;

import java.util.List;
import java.util.Optional;

public interface EstudianteGateway {
    Estudiante guardar(Estudiante estudiante);

    Estudiante actualizar(Estudiante estudiante);

    void eliminar(Long idEstudiante);

    Optional<Estudiante> buscarPorId(Long idEstudiante);

    long contarPorCurso(Long idCurso);

    List<Estudiante> listarPorCurso(Long idCurso);
}
