package co.edu.iem.pae.usecases.insumo;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.InsumoGateway;
import co.edu.iem.pae.domain.gateway.MovimientoInsumoGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.CalculadorIndicadores;
import co.edu.iem.pae.domain.model.Insumo;
import co.edu.iem.pae.domain.model.MovimientoInsumo;
import co.edu.iem.pae.domain.model.PlanRacion;

import java.time.LocalDate;
import java.util.List;

public class MovimientoInsumoUseCase {

    private final InsumoGateway insumoGateway;
    private final MovimientoInsumoGateway movimientoInsumoGateway;
    private final PlanRacionGateway planRacionGateway;

    public MovimientoInsumoUseCase(InsumoGateway insumoGateway, MovimientoInsumoGateway movimientoInsumoGateway,
                                    PlanRacionGateway planRacionGateway) {
        this.insumoGateway = insumoGateway;
        this.movimientoInsumoGateway = movimientoInsumoGateway;
        this.planRacionGateway = planRacionGateway;
    }

    public MovimientoInsumo registrarMovimiento(Long idInsumo, LocalDate fecha, double cantidadRecibidaKg) {
        if (cantidadRecibidaKg < 0) {
            throw new IllegalArgumentException("La cantidad recibida no puede ser negativa");
        }

        Insumo insumo = insumoGateway.buscarPorId(idInsumo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el insumo con id " + idInsumo));

        double stockInicial = movimientoInsumoGateway.buscarUltimoMovimiento(idInsumo)
                .map(MovimientoInsumo::getStockFinalKg)
                .orElse(insumo.getStockInicialConfigurado());

        long racionesAPreparar = planRacionGateway.listarPorFecha(fecha).stream()
                .mapToLong(PlanRacion::getRacionesPlanificadas)
                .sum();
        double consumoDelDia = CalculadorIndicadores.consumoDiarioInsumoKg(racionesAPreparar, insumo.getGramosPorRacion());

        MovimientoInsumo movimiento = new MovimientoInsumo(null, idInsumo, fecha, stockInicial,
                cantidadRecibidaKg, consumoDelDia);
        return movimientoInsumoGateway.guardar(movimiento);
    }

    public List<MovimientoInsumo> listarPorInsumo(Long idInsumo) {
        insumoGateway.buscarPorId(idInsumo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el insumo con id " + idInsumo));
        return movimientoInsumoGateway.listarPorInsumo(idInsumo);
    }
}
