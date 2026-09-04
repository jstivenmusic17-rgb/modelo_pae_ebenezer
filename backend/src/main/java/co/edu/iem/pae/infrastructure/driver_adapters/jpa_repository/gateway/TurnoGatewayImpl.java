package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.TurnoGateway;
import co.edu.iem.pae.domain.model.Turno;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.TurnoEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.TurnoJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class TurnoGatewayImpl implements TurnoGateway {

    private final TurnoJpaRepository turnoJpaRepository;

    public TurnoGatewayImpl(TurnoJpaRepository turnoJpaRepository) {
        this.turnoJpaRepository = turnoJpaRepository;
    }

    @Override
    public Turno guardar(Turno turno) {
        TurnoEntity entity = new TurnoEntity(turno.getIdTurno(), turno.getNombreTurno(), turno.getHorasDuracion());
        return aDominio(turnoJpaRepository.save(entity));
    }

    @Override
    public Optional<Turno> buscarPorId(Long idTurno) {
        return turnoJpaRepository.findById(idTurno).map(this::aDominio);
    }

    @Override
    public List<Turno> listarTodos() {
        return turnoJpaRepository.findAll().stream().map(this::aDominio).toList();
    }

    private Turno aDominio(TurnoEntity entity) {
        return new Turno(entity.getIdTurno(), entity.getNombreTurno(), entity.getHorasDuracion());
    }
}
