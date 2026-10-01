package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.gateway;

import co.edu.iem.pae.domain.gateway.ParametrosModeloGateway;
import co.edu.iem.pae.domain.model.ParametrosModelo;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity.ParametrosModeloEntity;
import co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.repository.ParametrosModeloJpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ParametrosModeloGatewayImpl implements ParametrosModeloGateway {
    private final ParametrosModeloJpaRepository parametrosModeloJpaRepository;

    public ParametrosModeloGatewayImpl(ParametrosModeloJpaRepository parametrosModeloJpaRepository) {
        this.parametrosModeloJpaRepository = parametrosModeloJpaRepository;
    }

    @Override
    public Optional<ParametrosModelo> obtener() {
        return parametrosModeloJpaRepository.findById(ParametrosModeloEntity.ID_UNICO).map(this::aDominio);
    }

    @Override
    public ParametrosModelo guardar(ParametrosModelo parametros) {
        ParametrosModeloEntity entity = new ParametrosModeloEntity(
                ParametrosModeloEntity.ID_UNICO,
                parametros.getCostoProduccionUnitario(),
                parametros.getCostoFaltanteUnitario(),
                parametros.getCostoSobranteUnitario(),
                parametros.getCoeficienteVariacion(),
                parametros.getMargenSeguridadReferencia(),
                parametros.getTasaAsistenciaDefecto());
        return aDominio(parametrosModeloJpaRepository.save(entity));
    }

    private ParametrosModelo aDominio(ParametrosModeloEntity entity) {
        return new ParametrosModelo(
                entity.getCostoProduccionUnitario(),
                entity.getCostoFaltanteUnitario(),
                entity.getCostoSobranteUnitario(),
                entity.getCoeficienteVariacion(),
                entity.getMargenSeguridadReferencia(),
                entity.getTasaAsistenciaDefecto());
    }
}
