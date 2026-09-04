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
import java.util.Set;

public class InsumoUseCase {

    private static final Set<String> UNIDADES_VALIDAS = Set.of("kg", "g", "unidad", "litro");

    private final InsumoGateway insumoGateway;
    private final PlanRacionGateway planRacionGateway;
    private final MovimientoInsumoGateway movimientoInsumoGateway;

    public InsumoUseCase(InsumoGateway insumoGateway, PlanRacionGateway planRacionGateway,
                          MovimientoInsumoGateway movimientoInsumoGateway) {
        this.insumoGateway = insumoGateway;
        this.planRacionGateway = planRacionGateway;
        this.movimientoInsumoGateway = movimientoInsumoGateway;
    }

    public Insumo crearInsumo(String nombreInsumo, String unidadMedida, double gramosPorRacion,
                               double stockInicialConfigurado, double stockReserva, int diasEntregaProveedor) {
        if (nombreInsumo == null || nombreInsumo.isBlank()) {
            throw new IllegalArgumentException("El nombre del insumo no puede estar vacio");
        }
        if (gramosPorRacion <= 0) {
            throw new IllegalArgumentException("Los gramos por racion deben ser mayores a 0");
        }
        String nombreLimpio = nombreInsumo.trim();
        if (existeNombreDuplicado(nombreLimpio, null)) {
            throw new IllegalArgumentException("Ya existe un insumo llamado '" + nombreLimpio + "'");
        }
        String unidadNormalizada = validarUnidadMedida(unidadMedida);
        Insumo insumo = new Insumo(null, nombreLimpio, unidadNormalizada, gramosPorRacion,
                stockInicialConfigurado, stockReserva, diasEntregaProveedor);
        return insumoGateway.guardar(insumo);
    }

    public Insumo actualizarInsumo(Long idInsumo, String nombreInsumo, String unidadMedida, double gramosPorRacion,
                                    double stockInicialConfigurado, double stockReserva, int diasEntregaProveedor) {
        consultarInsumo(idInsumo);
        if (nombreInsumo == null || nombreInsumo.isBlank()) {
            throw new IllegalArgumentException("El nombre del insumo no puede estar vacio");
        }
        String nombreLimpio = nombreInsumo.trim();
        if (existeNombreDuplicado(nombreLimpio, idInsumo)) {
            throw new IllegalArgumentException("Ya existe un insumo llamado '" + nombreLimpio + "'");
        }
        String unidadNormalizada = validarUnidadMedida(unidadMedida);
        Insumo insumo = new Insumo(idInsumo, nombreLimpio, unidadNormalizada, gramosPorRacion,
                stockInicialConfigurado, stockReserva, diasEntregaProveedor);
        return insumoGateway.actualizar(insumo);
    }

    public void eliminarInsumo(Long idInsumo) {
        consultarInsumo(idInsumo);
        if (!movimientoInsumoGateway.listarPorInsumo(idInsumo).isEmpty()) {
            throw new IllegalArgumentException(
                    "No se puede eliminar el insumo con id " + idInsumo + " porque tiene movimientos de inventario registrados");
        }
        insumoGateway.eliminar(idInsumo);
    }

    public Insumo consultarInsumo(Long idInsumo) {
        return insumoGateway.buscarPorId(idInsumo)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el insumo con id " + idInsumo));
    }

    public List<Insumo> listarInsumos() {
        return insumoGateway.listarTodos();
    }

    public double calcularConsumoDiarioKg(Long idInsumo, LocalDate fecha) {
        Insumo insumo = consultarInsumo(idInsumo);
        long racionesAPreparar = planRacionGateway.listarPorFecha(fecha).stream()
                .mapToLong(PlanRacion::getRacionesPlanificadas)
                .sum();
        return CalculadorIndicadores.consumoDiarioInsumoKg(racionesAPreparar, insumo.getGramosPorRacion());
    }

    public double calcularPuntoReordenKg(Long idInsumo) {
        Insumo insumo = consultarInsumo(idInsumo);
        List<MovimientoInsumo> historial = movimientoInsumoGateway.listarPorInsumo(idInsumo);

        double consumoDiarioPromedio;
        if (historial.isEmpty()) {
            consumoDiarioPromedio = calcularConsumoDiarioKg(idInsumo, LocalDate.now());
        } else {
            consumoDiarioPromedio = historial.stream()
                    .mapToDouble(MovimientoInsumo::getConsumoDelDiaKg)
                    .average()
                    .orElse(0);
        }

        return CalculadorIndicadores.puntoReordenKg(consumoDiarioPromedio, insumo.getDiasEntregaProveedor(), insumo.getStockReserva());
    }

    private boolean existeNombreDuplicado(String nombre, Long idAExcluir) {
        return insumoGateway.listarTodos().stream()
                .anyMatch(i -> !i.getIdInsumo().equals(idAExcluir) && i.getNombreInsumo().equalsIgnoreCase(nombre));
    }

    private String validarUnidadMedida(String unidadMedida) {
        if (unidadMedida == null || unidadMedida.isBlank()) {
            throw new IllegalArgumentException("La unidad de medida no puede estar vacia");
        }
        String unidadNormalizada = unidadMedida.trim().toLowerCase();
        if (!UNIDADES_VALIDAS.contains(unidadNormalizada)) {
            throw new IllegalArgumentException("unidadMedida debe ser una de: " + UNIDADES_VALIDAS);
        }
        return unidadNormalizada;
    }
}
