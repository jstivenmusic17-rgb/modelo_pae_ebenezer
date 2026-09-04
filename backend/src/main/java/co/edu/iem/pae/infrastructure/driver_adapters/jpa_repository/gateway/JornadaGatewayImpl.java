package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.JornadaGateway;
import co.edu.iem.pae.domain.model.Jornada;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.JornadaEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.JornadaJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class JornadaGatewayImpl implements JornadaGateway {
    private final JornadaJpaRepository jornadaJpaRepository;

    public JornadaGatewayImpl(JornadaJpaRepository jornadaJpaRepository) {
        this.jornadaJpaRepository = jornadaJpaRepository;
    }

    @Override
    public Jornada guardar(Jornada jornada) {
        JornadaEntity entity = new JornadaEntity(jornada.getIdJornada(), jornada.getNombreJornada());
        JornadaEntity entityGuardada = jornadaJpaRepository.save(entity);
        return aDominio(entityGuardada);
    }

    @Override
    public Jornada actualizar(Jornada jornada) {
        JornadaEntity entity = new JornadaEntity(jornada.getIdJornada(), jornada.getNombreJornada());
        JornadaEntity entityActualizada = jornadaJpaRepository.save(entity);
        return aDominio(entityActualizada);
    }

    @Override
    public void eliminar(Long idJornada) {
        jornadaJpaRepository.deleteById(idJornada);
    }

    @Override
    public Optional<Jornada> buscarPorId(Long idJornada) {
        return jornadaJpaRepository.findById(idJornada).map(this::aDominio);
    }

    @Override
    public List<Jornada> listarTodas() {
        return jornadaJpaRepository.findAll().stream().map(this::aDominio).toList();
    }

    private Jornada aDominio(JornadaEntity entity) {
        return new Jornada(entity.getIdJornada(), entity.getNombreJornada());
    }
}
