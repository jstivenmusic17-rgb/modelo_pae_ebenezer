package co.edu.iem.pae.usecases.jornada;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.CursoGateway;
import co.edu.iem.pae.domain.gateway.JornadaGateway;
import co.edu.iem.pae.domain.model.Jornada;

import java.util.List;

public class JornadaUseCase {
    private final JornadaGateway jornadaGateway;
    private final CursoGateway cursoGateway;

    public JornadaUseCase(JornadaGateway jornadaGateway, CursoGateway cursoGateway) {
        this.jornadaGateway = jornadaGateway;
        this.cursoGateway = cursoGateway;
    }

    public Jornada crearJornada(String nombreJornada) {
        if (nombreJornada == null || nombreJornada.isBlank()) {
            throw new IllegalArgumentException("El nombre de la jornada no puede estar vacio");
        }
        String nombreLimpio = nombreJornada.trim();
        if (existeNombreDuplicado(nombreLimpio, null)) {
            throw new IllegalArgumentException("Ya existe una jornada llamada '" + nombreLimpio + "'");
        }
        Jornada jornada = new Jornada(null, nombreLimpio);
        return jornadaGateway.guardar(jornada);
    }

    public Jornada actualizarJornada(Long idJornada, String nombreJornada) {
        consultarJornada(idJornada);
        if (nombreJornada == null || nombreJornada.isBlank()) {
            throw new IllegalArgumentException("El nombre de la jornada no puede estar vacio");
        }
        String nombreLimpio = nombreJornada.trim();
        if (existeNombreDuplicado(nombreLimpio, idJornada)) {
            throw new IllegalArgumentException("Ya existe una jornada llamada '" + nombreLimpio + "'");
        }
        Jornada jornada = new Jornada(idJornada, nombreLimpio);
        return jornadaGateway.actualizar(jornada);
    }

    private boolean existeNombreDuplicado(String nombre, Long idAExcluir) {
        return jornadaGateway.listarTodas().stream()
                .anyMatch(j -> !j.getIdJornada().equals(idAExcluir) && j.getNombreJornada().equalsIgnoreCase(nombre));
    }

    public void eliminarJornada(Long idJornada) {
        consultarJornada(idJornada);

        if (!cursoGateway.listarPorJornada(idJornada).isEmpty()) {
            throw new IllegalArgumentException(
                    "No se puede eliminar la jornada con id " + idJornada + " porque tiene cursos asociados");
        }

        jornadaGateway.eliminar(idJornada);
    }

    public Jornada consultarJornada(Long idJornada) {
        return jornadaGateway.buscarPorId(idJornada)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe la jornada con id " + idJornada));
    }

    public List<Jornada> listarJornadas() {
        return jornadaGateway.listarTodas();
    }
}
