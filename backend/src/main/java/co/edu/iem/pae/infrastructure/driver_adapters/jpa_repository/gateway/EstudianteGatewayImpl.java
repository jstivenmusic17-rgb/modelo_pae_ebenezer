package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.EstudianteGateway;
import co.edu.iem.pae.domain.model.Estudiante;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.EstudianteEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.EstudianteJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class EstudianteGatewayImpl implements EstudianteGateway {
    private final EstudianteJpaRepository estudianteJpaRepository;

    public EstudianteGatewayImpl(EstudianteJpaRepository estudianteJpaRepository) {
        this.estudianteJpaRepository = estudianteJpaRepository;
    }

    @Override
    public Estudiante guardar(Estudiante estudiante) {
        EstudianteEntity entity = new EstudianteEntity(estudiante.getIdEstudiante(), estudiante.getDocumentoIdentidad(),
                estudiante.getNombreCompleto(), estudiante.getIdCurso());
        EstudianteEntity entityGuardada = estudianteJpaRepository.save(entity);
        return aDominio(entityGuardada);
    }

    @Override
    public Estudiante actualizar(Estudiante estudiante) {
        EstudianteEntity entity = new EstudianteEntity(estudiante.getIdEstudiante(), estudiante.getDocumentoIdentidad(),
                estudiante.getNombreCompleto(), estudiante.getIdCurso());
        EstudianteEntity entityActualizada = estudianteJpaRepository.save(entity);
        return aDominio(entityActualizada);
    }

    @Override
    public void eliminar(Long idEstudiante) {
        estudianteJpaRepository.deleteById(idEstudiante);
    }

    @Override
    public Optional<Estudiante> buscarPorId(Long idEstudiante) {
        return estudianteJpaRepository.findById(idEstudiante).map(this::aDominio);
    }

    @Override
    public long contarPorCurso(Long idCurso) {
        return estudianteJpaRepository.countByIdCurso(idCurso);
    }

    @Override
    public List<Estudiante> listarPorCurso(Long idCurso) {
        return estudianteJpaRepository.findByIdCurso(idCurso).stream().map(this::aDominio).toList();
    }

    private Estudiante aDominio(EstudianteEntity entity) {
        return new Estudiante(entity.getIdEstudiante(), entity.getDocumentoIdentidad(),
                entity.getNombreCompleto(), entity.getIdCurso());
    }
}
