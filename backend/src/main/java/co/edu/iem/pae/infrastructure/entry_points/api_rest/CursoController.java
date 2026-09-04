package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.Curso;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CrearCursoRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CursoResponse;
import co.edu.iem.pae.usecases.curso.CursoUseCase;
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
@RequestMapping("/api/pae/curso")
public class CursoController {
    private final CursoUseCase cursoUseCase;

    public CursoController(CursoUseCase cursoUseCase) {
        this.cursoUseCase = cursoUseCase;
    }

    @PostMapping
    public ResponseEntity<CursoResponse> crear(@Valid @RequestBody CrearCursoRequest request) {
        Curso curso = cursoUseCase.crearCurso(request.nombreCurso(), request.idJornada());
        return ResponseEntity.status(HttpStatus.CREATED).body(CursoResponse.desde(curso));
    }

    @GetMapping("/{idCurso}")
    public ResponseEntity<CursoResponse> consultar(@PathVariable Long idCurso) {
        Curso curso = cursoUseCase.consultarCurso(idCurso);
        return ResponseEntity.ok(CursoResponse.desde(curso));
    }

    @GetMapping
    public ResponseEntity<List<CursoResponse>> listarTodos() {
        List<CursoResponse> cursos = cursoUseCase.listarTodosLosCursos().stream()
                .map(CursoResponse::desde)
                .toList();
        return ResponseEntity.ok(cursos);
    }

    @GetMapping("/jornada/{idJornada}")
    public ResponseEntity<List<CursoResponse>> listarPorJornada(@PathVariable Long idJornada) {
        List<CursoResponse> cursos = cursoUseCase.listarCursosPorJornada(idJornada).stream()
                .map(CursoResponse::desde)
                .toList();
        return ResponseEntity.ok(cursos);
    }

    @PutMapping("/{idCurso}")
    public ResponseEntity<CursoResponse> actualizar(@PathVariable Long idCurso,
                                                      @Valid @RequestBody CrearCursoRequest request) {
        Curso curso = cursoUseCase.actualizarCurso(idCurso, request.nombreCurso(), request.idJornada());
        return ResponseEntity.ok(CursoResponse.desde(curso));
    }

    @DeleteMapping("/{idCurso}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idCurso) {
        cursoUseCase.eliminarCurso(idCurso);
        return ResponseEntity.noContent().build();
    }
}
