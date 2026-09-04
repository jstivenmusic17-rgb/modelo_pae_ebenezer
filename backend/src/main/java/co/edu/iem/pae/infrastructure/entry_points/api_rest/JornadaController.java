package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.Jornada;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CrearJornadaRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.JornadaResponse;
import co.edu.iem.pae.usecases.jornada.JornadaUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pae/jornada")
public class JornadaController {
    private final JornadaUseCase jornadaUseCase;

    public JornadaController(JornadaUseCase jornadaUseCase) {
        this.jornadaUseCase = jornadaUseCase;
    }

    @PostMapping
    public ResponseEntity<JornadaResponse> crear(@Valid @RequestBody CrearJornadaRequest request) {
        Jornada jornada = jornadaUseCase.crearJornada(request.nombreJornada());
        return ResponseEntity.status(HttpStatus.CREATED).body(JornadaResponse.desde(jornada));
    }

    @GetMapping("/{idJornada}")
    public ResponseEntity<JornadaResponse> consultar(@PathVariable Long idJornada) {
        Jornada jornada = jornadaUseCase.consultarJornada(idJornada);
        return ResponseEntity.ok(JornadaResponse.desde(jornada));
    }

    @GetMapping
    public ResponseEntity<List<JornadaResponse>> listar() {
        List<JornadaResponse> jornadas = jornadaUseCase.listarJornadas().stream()
                .map(JornadaResponse::desde)
                .toList();
        return ResponseEntity.ok(jornadas);
    }

    @PutMapping("/{idJornada}")
    public ResponseEntity<JornadaResponse> actualizar(@PathVariable Long idJornada,
                                                        @Valid @RequestBody CrearJornadaRequest request) {
        Jornada jornada = jornadaUseCase.actualizarJornada(idJornada, request.nombreJornada());
        return ResponseEntity.ok(JornadaResponse.desde(jornada));
    }

    @DeleteMapping("/{idJornada}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idJornada) {
        jornadaUseCase.eliminarJornada(idJornada);
        return ResponseEntity.noContent().build();
    }
}
