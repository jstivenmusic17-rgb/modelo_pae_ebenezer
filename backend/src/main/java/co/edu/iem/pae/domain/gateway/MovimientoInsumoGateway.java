package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.MovimientoInsumo;

import java.util.List;
import java.util.Optional;

public interface MovimientoInsumoGateway {
    MovimientoInsumo guardar(MovimientoInsumo movimiento);

    Optional<MovimientoInsumo> buscarUltimoMovimiento(Long idInsumo);

    List<MovimientoInsumo> listarPorInsumo(Long idInsumo);
}
