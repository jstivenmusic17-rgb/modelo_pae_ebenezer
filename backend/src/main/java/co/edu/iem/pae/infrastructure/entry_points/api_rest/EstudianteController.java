package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.Estudiante;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CrearEstudianteRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.EstudianteResponse;
import co.edu.iem.pae.usecases.estudiante.EstudianteUseCase;
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
@RequestMapping("/api/pae/estudiante")
public class EstudianteController {
    private final EstudianteUseCase estudianteUseCase;

    public EstudianteController(EstudianteUseCase estudianteUseCase) {
        this.estudianteUseCase = estudianteUseCase;
    }

    @PostMapping
    public ResponseEntity<EstudianteResponse> matricular(@Valid @RequestBody CrearEstudianteRequest request) {
        Estudiante estudiante = estudianteUseCase.matricularEstudiante(
                request.documentoIdentidad(), request.nombreCompleto(), request.idCurso());
        return ResponseEntity.status(HttpStatus.CREATED).body(EstudianteResponse.desde(estudiante));
    }

    @GetMapping("/{idEstudiante}")
    public ResponseEntity<EstudianteResponse> consultar(@PathVariable Long idEstudiante) {
        Estudiante estudiante = estudianteUseCase.consultarEstudiante(idEstudiante);
        return ResponseEntity.ok(EstudianteResponse.desde(estudiante));
    }

    @GetMapping("/curso/{idCurso}")
    public ResponseEntity<List<EstudianteResponse>> listarPorCurso(@PathVariable Long idCurso) {
        List<EstudianteResponse> estudiantes = estudianteUseCase.listarEstudiantesPorCurso(idCurso).stream()
                .map(EstudianteResponse::desde)
                .toList();
        return ResponseEntity.ok(estudiantes);
    }

    @PutMapping("/{idEstudiante}")
    public ResponseEntity<EstudianteResponse> actualizar(@PathVariable Long idEstudiante,
                                                           @Valid @RequestBody CrearEstudianteRequest request) {
        Estudiante estudiante = estudianteUseCase.actualizarEstudiante(
                idEstudiante, request.documentoIdentidad(), request.nombreCompleto(), request.idCurso());
        return ResponseEntity.ok(EstudianteResponse.desde(estudiante));
    }

    @DeleteMapping("/{idEstudiante}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idEstudiante) {
        estudianteUseCase.eliminarEstudiante(idEstudiante);
        return ResponseEntity.noContent().build();
    }
}
