package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.PersonalCocina;
import co.edu.iem.pae.domain.model.Turno;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CrearPersonalCocinaRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CrearTurnoRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.PersonalCocinaResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.TurnoResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ValorCalculadoResponse;
import co.edu.iem.pae.usecases.cocina.CocinaUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pae/cocina")
public class CocinaController {

    private final CocinaUseCase cocinaUseCase;

    public CocinaController(CocinaUseCase cocinaUseCase) {
        this.cocinaUseCase = cocinaUseCase;
    }

    @PostMapping("/turno")
    public ResponseEntity<TurnoResponse> crearTurno(@Valid @RequestBody CrearTurnoRequest request) {
        Turno turno = cocinaUseCase.crearTurno(request.nombreTurno(), request.horasDuracion());
        return ResponseEntity.status(HttpStatus.CREATED).body(TurnoResponse.desde(turno));
    }

    @GetMapping("/turno")
    public ResponseEntity<List<TurnoResponse>> listarTurnos() {
        return ResponseEntity.ok(cocinaUseCase.listarTurnos().stream().map(TurnoResponse::desde).toList());
    }

    @GetMapping("/turno/{idTurno}")
    public ResponseEntity<TurnoResponse> consultarTurno(@PathVariable Long idTurno) {
        return ResponseEntity.ok(TurnoResponse.desde(cocinaUseCase.consultarTurno(idTurno)));
    }

    @GetMapping("/turno/{idTurno}/capacidad-maxima")
    public ResponseEntity<ValorCalculadoResponse> capacidadMaxima(@PathVariable Long idTurno) {
        double capacidad = cocinaUseCase.calcularCapacidadMaximaCocina(idTurno);
        return ResponseEntity.ok(new ValorCalculadoResponse("capacidadMaximaRaciones", capacidad));
    }

    @PostMapping("/personal")
    public ResponseEntity<PersonalCocinaResponse> registrarPersonal(@Valid @RequestBody CrearPersonalCocinaRequest request) {
        PersonalCocina personal = cocinaUseCase.registrarPersonal(request.nombreCompleto(),
                request.racionesPorHoraCapacidad(), request.idTurno());
        return ResponseEntity.status(HttpStatus.CREATED).body(PersonalCocinaResponse.desde(personal));
    }

    @GetMapping("/personal")
    public ResponseEntity<List<PersonalCocinaResponse>> listarTodoElPersonal() {
        return ResponseEntity.ok(cocinaUseCase.listarTodoElPersonal().stream().map(PersonalCocinaResponse::desde).toList());
    }

    @GetMapping("/turno/{idTurno}/personal")
    public ResponseEntity<List<PersonalCocinaResponse>> listarPersonalPorTurno(@PathVariable Long idTurno) {
        return ResponseEntity.ok(cocinaUseCase.listarPersonalPorTurno(idTurno).stream().map(PersonalCocinaResponse::desde).toList());
    }
}
