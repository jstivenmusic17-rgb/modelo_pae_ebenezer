package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ParametrosModeloRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ParametrosModeloResponse;
import co.edu.iem.pae.usecases.parametros.ParametrosModeloUseCase;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pae/parametros")
public class ParametrosModeloController {
    private final ParametrosModeloUseCase parametrosModeloUseCase;

    public ParametrosModeloController(ParametrosModeloUseCase parametrosModeloUseCase) {
        this.parametrosModeloUseCase = parametrosModeloUseCase;
    }

    @GetMapping
    public ResponseEntity<ParametrosModeloResponse> obtener() {
        return ResponseEntity.ok(ParametrosModeloResponse.desde(parametrosModeloUseCase.obtener()));
    }

    @PutMapping
    public ResponseEntity<ParametrosModeloResponse> actualizar(@Valid @RequestBody ParametrosModeloRequest request) {
        return ResponseEntity.ok(ParametrosModeloResponse.desde(parametrosModeloUseCase.actualizar(request.aDominio())));
    }
}
