package co.edu.iem.pae.usecases.entrega;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.EntregaRacionGateway;
import co.edu.iem.pae.domain.gateway.PlanRacionGateway;
import co.edu.iem.pae.domain.model.EntregaRacion;
import co.edu.iem.pae.domain.model.PlanRacion;

public class EntregaRacionUseCase {
    private final PlanRacionGateway planRacionGateway;
    private final EntregaRacionGateway entregaRacionGateway;

    public EntregaRacionUseCase(PlanRacionGateway planRacionGateway, EntregaRacionGateway entregaRacionGateway) {
        this.planRacionGateway = planRacionGateway;
        this.entregaRacionGateway = entregaRacionGateway;
    }

    public EntregaRacion registrarEntrega(Long idPlan, int racionesServidas) {
        if (racionesServidas < 0) {
            throw new IllegalArgumentException("Las raciones servidas no pueden ser negativas");
        }

        PlanRacion plan = planRacionGateway.buscarPorId(idPlan)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el plan de racion con id " + idPlan));

        if (entregaRacionGateway.buscarPorPlan(idPlan).isPresent()) {
            throw new IllegalArgumentException("Ya existe una entrega registrada para el plan con id " + idPlan);
        }

        EntregaRacion entrega = EntregaRacion.calcularDesdeServidas(null, plan, racionesServidas);
        return entregaRacionGateway.guardar(entrega);
    }

    public EntregaRacion consultarEntregaPorPlan(Long idPlan) {
        return entregaRacionGateway.buscarPorPlan(idPlan)
                .orElseThrow(() -> new RecursoNoEncontradoException("No hay entrega registrada para el plan con id " + idPlan));
    }
}
