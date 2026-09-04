package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.EntregaRacion;

import java.util.Optional;

public interface EntregaRacionGateway {
    EntregaRacion guardar(EntregaRacion entregaRacion);

    Optional<EntregaRacion> buscarPorPlan(Long idPlan);
}
