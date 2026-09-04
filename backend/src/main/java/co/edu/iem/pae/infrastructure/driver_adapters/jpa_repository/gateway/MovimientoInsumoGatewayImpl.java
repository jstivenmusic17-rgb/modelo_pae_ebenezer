package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.MovimientoInsumoGateway;
import co.edu.iem.pae.domain.model.MovimientoInsumo;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.MovimientoInsumoEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.MovimientoInsumoJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class MovimientoInsumoGatewayImpl implements MovimientoInsumoGateway {

    private final MovimientoInsumoJpaRepository movimientoInsumoJpaRepository;

    public MovimientoInsumoGatewayImpl(MovimientoInsumoJpaRepository movimientoInsumoJpaRepository) {
        this.movimientoInsumoJpaRepository = movimientoInsumoJpaRepository;
    }

    @Override
    public MovimientoInsumo guardar(MovimientoInsumo movimiento) {
        MovimientoInsumoEntity entity = new MovimientoInsumoEntity(movimiento.getIdMovimiento(), movimiento.getIdInsumo(),
                movimiento.getFecha(), movimiento.getStockInicialKg(), movimiento.getCantidadRecibidaKg(),
                movimiento.getConsumoDelDiaKg());
        return aDominio(movimientoInsumoJpaRepository.save(entity));
    }

    @Override
    public Optional<MovimientoInsumo> buscarUltimoMovimiento(Long idInsumo) {
        return movimientoInsumoJpaRepository.findFirstByIdInsumoOrderByFechaDesc(idInsumo).map(this::aDominio);
    }

    @Override
    public List<MovimientoInsumo> listarPorInsumo(Long idInsumo) {
        return movimientoInsumoJpaRepository.findByIdInsumoOrderByFechaAsc(idInsumo).stream().map(this::aDominio).toList();
    }

    private MovimientoInsumo aDominio(MovimientoInsumoEntity entity) {
        return new MovimientoInsumo(entity.getIdMovimiento(), entity.getIdInsumo(), entity.getFecha(),
                entity.getStockInicialKg(), entity.getCantidadRecibidaKg(), entity.getConsumoDelDiaKg());
    }
}
