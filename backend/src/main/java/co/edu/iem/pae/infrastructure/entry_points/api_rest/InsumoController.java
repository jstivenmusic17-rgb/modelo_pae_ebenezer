package co.edu.iem.pae.infrastructure.entry_points.api_rest;

import co.edu.iem.pae.domain.model.Insumo;
import co.edu.iem.pae.domain.model.MovimientoInsumo;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.CrearInsumoRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.InsumoResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.MovimientoInsumoResponse;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.RegistrarMovimientoRequest;
import co.edu.iem.pae.infrastructure.entry_points.api_rest.dto.ValorCalculadoResponse;
import co.edu.iem.pae.usecases.insumo.InsumoUseCase;
import co.edu.iem.pae.usecases.insumo.MovimientoInsumoUseCase;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pae/insumo")
public class InsumoController {

    private final InsumoUseCase insumoUseCase;
    private final MovimientoInsumoUseCase movimientoInsumoUseCase;

    public InsumoController(InsumoUseCase insumoUseCase, MovimientoInsumoUseCase movimientoInsumoUseCase) {
        this.insumoUseCase = insumoUseCase;
        this.movimientoInsumoUseCase = movimientoInsumoUseCase;
    }

    @PostMapping
    public ResponseEntity<InsumoResponse> crear(@Valid @RequestBody CrearInsumoRequest request) {
        Insumo insumo = insumoUseCase.crearInsumo(request.nombreInsumo(), request.unidadMedida(),
                request.gramosPorRacion(), request.stockInicialConfigurado(), request.stockReserva(),
                request.diasEntregaProveedor());
        return ResponseEntity.status(HttpStatus.CREATED).body(InsumoResponse.desde(insumo));
    }

    @GetMapping("/{idInsumo}")
    public ResponseEntity<InsumoResponse> consultar(@PathVariable Long idInsumo) {
        return ResponseEntity.ok(InsumoResponse.desde(insumoUseCase.consultarInsumo(idInsumo)));
    }

    @GetMapping
    public ResponseEntity<List<InsumoResponse>> listar() {
        List<InsumoResponse> insumos = insumoUseCase.listarInsumos().stream().map(InsumoResponse::desde).toList();
        return ResponseEntity.ok(insumos);
    }

    @PutMapping("/{idInsumo}")
    public ResponseEntity<InsumoResponse> actualizar(@PathVariable Long idInsumo, @Valid @RequestBody CrearInsumoRequest request) {
        Insumo insumo = insumoUseCase.actualizarInsumo(idInsumo, request.nombreInsumo(), request.unidadMedida(),
                request.gramosPorRacion(), request.stockInicialConfigurado(), request.stockReserva(),
                request.diasEntregaProveedor());
        return ResponseEntity.ok(InsumoResponse.desde(insumo));
    }

    @DeleteMapping("/{idInsumo}")
    public ResponseEntity<Void> eliminar(@PathVariable Long idInsumo) {
        insumoUseCase.eliminarInsumo(idInsumo);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{idInsumo}/consumo-diario")
    public ResponseEntity<ValorCalculadoResponse> consumoDiario(@PathVariable Long idInsumo,
                                                                  @RequestParam("fecha") LocalDate fecha) {
        double consumoKg = insumoUseCase.calcularConsumoDiarioKg(idInsumo, fecha);
        return ResponseEntity.ok(new ValorCalculadoResponse("consumoDiarioKg", consumoKg));
    }

    @GetMapping("/{idInsumo}/punto-reorden")
    public ResponseEntity<ValorCalculadoResponse> puntoReorden(@PathVariable Long idInsumo) {
        double puntoReordenKg = insumoUseCase.calcularPuntoReordenKg(idInsumo);
        return ResponseEntity.ok(new ValorCalculadoResponse("puntoReordenKg", puntoReordenKg));
    }

    @PostMapping("/{idInsumo}/movimiento")
    public ResponseEntity<MovimientoInsumoResponse> registrarMovimiento(@PathVariable Long idInsumo,
                                                                          @Valid @RequestBody RegistrarMovimientoRequest request) {
        MovimientoInsumo movimiento = movimientoInsumoUseCase.registrarMovimiento(idInsumo, request.fecha(), request.cantidadRecibidaKg());
        return ResponseEntity.status(HttpStatus.CREATED).body(MovimientoInsumoResponse.desde(movimiento));
    }

    @GetMapping("/{idInsumo}/movimiento")
    public ResponseEntity<List<MovimientoInsumoResponse>> listarMovimientos(@PathVariable Long idInsumo) {
        List<MovimientoInsumoResponse> movimientos = movimientoInsumoUseCase.listarPorInsumo(idInsumo).stream()
                .map(MovimientoInsumoResponse::desde)
                .toList();
        return ResponseEntity.ok(movimientos);
    }
}
