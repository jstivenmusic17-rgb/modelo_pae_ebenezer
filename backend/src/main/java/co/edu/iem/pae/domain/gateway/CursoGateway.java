package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.Curso;

import java.util.List;
import java.util.Optional;

public interface CursoGateway {
    Curso guardar(Curso curso);

    Curso actualizar(Curso curso);

    void eliminar(Long idCurso);

    Optional<Curso> buscarPorId(Long idCurso);

    List<Curso> listarPorJornada(Long idJornada);

    List<Curso> listarTodos();
}
