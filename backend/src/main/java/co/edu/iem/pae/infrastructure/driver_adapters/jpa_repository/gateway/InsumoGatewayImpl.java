package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.InsumoGateway;
import co.edu.iem.pae.domain.model.Insumo;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.InsumoEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.InsumoJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class InsumoGatewayImpl implements InsumoGateway {

    private final InsumoJpaRepository insumoJpaRepository;

    public InsumoGatewayImpl(InsumoJpaRepository insumoJpaRepository) {
        this.insumoJpaRepository = insumoJpaRepository;
    }

    @Override
    public Insumo guardar(Insumo insumo) {
        return aDominio(insumoJpaRepository.save(aEntidad(insumo)));
    }

    @Override
    public Insumo actualizar(Insumo insumo) {
        return aDominio(insumoJpaRepository.save(aEntidad(insumo)));
    }

    @Override
    public void eliminar(Long idInsumo) {
        insumoJpaRepository.deleteById(idInsumo);
    }

    @Override
    public Optional<Insumo> buscarPorId(Long idInsumo) {
        return insumoJpaRepository.findById(idInsumo).map(this::aDominio);
    }

    @Override
    public List<Insumo> listarTodos() {
        return insumoJpaRepository.findAll().stream().map(this::aDominio).toList();
    }

    private InsumoEntity aEntidad(Insumo insumo) {
        return new InsumoEntity(insumo.getIdInsumo(), insumo.getNombreInsumo(), insumo.getUnidadMedida(),
                insumo.getGramosPorRacion(), insumo.getStockInicialConfigurado(), insumo.getStockReserva(),
                insumo.getDiasEntregaProveedor());
    }

    private Insumo aDominio(InsumoEntity entity) {
        return new Insumo(entity.getIdInsumo(), entity.getNombreInsumo(), entity.getUnidadMedida(),
                entity.getGramosPorRacion(), entity.getStockInicialConfigurado(), entity.getStockReserva(),
                entity.getDiasEntregaProveedor());
    }
}
