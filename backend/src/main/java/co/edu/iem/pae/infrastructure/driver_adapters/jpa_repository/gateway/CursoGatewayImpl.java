package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.CursoEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.CursoJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class CursoGatewayImpl implements CursoGateway {
    private final CursoJpaRepository cursoJpaRepository;

    public CursoGatewayImpl(CursoJpaRepository cursoJpaRepository) {
        this.cursoJpaRepository = cursoJpaRepository;
    }

    @Override
    public Curso guardar(Curso curso) {
        CursoEntity entity = new CursoEntity(curso.getIdCurso(), curso.getNombreCurso(), curso.getIdJornada());
        CursoEntity entityGuardada = cursoJpaRepository.save(entity);
        return aDominio(entityGuardada);
    }

    @Override
    public Curso actualizar(Curso curso) {
        CursoEntity entity = new CursoEntity(curso.getIdCurso(), curso.getNombreCurso(), curso.getIdJornada());
        CursoEntity entityActualizada = cursoJpaRepository.save(entity);
        return aDominio(entityActualizada);
    }

    @Override
    public void eliminar(Long idCurso) {
        cursoJpaRepository.deleteById(idCurso);
    }

    @Override
    public Optional<Curso> buscarPorId(Long idCurso) {
        return cursoJpaRepository.findById(idCurso).map(this::aDominio);
    }

    @Override
    public List<Curso> listarPorJornada(Long idJornada) {
        return cursoJpaRepository.findByIdJornada(idJornada).stream().map(this::aDominio).toList();
    }

    @Override
    public List<Curso> listarTodos() {
        return cursoJpaRepository.findAll().stream().map(this::aDominio).toList();
    }

    private Curso aDominio(CursoEntity entity) {
        return new Curso(entity.getIdCurso(), entity.getNombreCurso(), entity.getIdJornada());
    }
}
