package co.edu.iem.pae.domain.gateway;

import co.edu.iem.pae.domain.model.Insumo;

import java.util.List;
import java.util.Optional;

public interface InsumoGateway {
    Insumo guardar(Insumo insumo);

    Insumo actualizar(Insumo insumo);

    void eliminar(Long idInsumo);

    Optional<Insumo> buscarPorId(Long idInsumo);

    List<Insumo> listarTodos();
}
