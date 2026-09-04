package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.EntregaRacion;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.EntregaRacionResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.RegistrarEntregaRequest;
import co.edu.iem.pae.usecases.entrega.EntregaRacionUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pae/entrega")
public class EntregaRacionController {
    private final EntregaRacionUseCase entregaRacionUseCase;

    public EntregaRacionController(EntregaRacionUseCase entregaRacionUseCase) {
        this.entregaRacionUseCase = entregaRacionUseCase;
    }

    @PostMapping("/registrar")
    public ResponseEntity<EntregaRacionResponse> registrarEntrega(@Valid @RequestBody RegistrarEntregaRequest request) {
        EntregaRacion entrega = entregaRacionUseCase.registrarEntrega(request.idPlan(), request.racionesServidas());
        return ResponseEntity.status(HttpStatus.CREATED).body(EntregaRacionResponse.desde(entrega));
    }

    @GetMapping("/plan/{idPlan}")
    public ResponseEntity<EntregaRacionResponse> consultarPorPlan(@PathVariable Long idPlan) {
        EntregaRacion entrega = entregaRacionUseCase.consultarEntregaPorPlan(idPlan);
        return ResponseEntity.ok(EntregaRacionResponse.desde(entrega));
    }
}
