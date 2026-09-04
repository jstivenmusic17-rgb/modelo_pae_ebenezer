package co.edu.iem.pae.usecases.cocina;

import co.edu.iem.pae.domain.exception.RecursoNoEncontradoException;
import co.edu.iem.pae.domain.gateway.PersonalCocinaGateway;
import co.edu.iem.pae.domain.gateway.TurnoGateway;
import co.edu.iem.pae.domain.model.CalculadorIndicadores;
import co.edu.iem.pae.domain.model.PersonalCocina;
import co.edu.iem.pae.domain.model.Turno;

import java.util.List;

public class CocinaUseCase {

    private final TurnoGateway turnoGateway;
    private final PersonalCocinaGateway personalCocinaGateway;

    public CocinaUseCase(TurnoGateway turnoGateway, PersonalCocinaGateway personalCocinaGateway) {
        this.turnoGateway = turnoGateway;
        this.personalCocinaGateway = personalCocinaGateway;
    }

    public Turno crearTurno(String nombreTurno, double horasDuracion) {
        if (nombreTurno == null || nombreTurno.isBlank()) {
            throw new IllegalArgumentException("El nombre del turno no puede estar vacio");
        }
        if (horasDuracion <= 0) {
            throw new IllegalArgumentException("Las horas del turno deben ser mayores a 0");
        }
        return turnoGateway.guardar(new Turno(null, nombreTurno.trim(), horasDuracion));
    }

    public Turno consultarTurno(Long idTurno) {
        return turnoGateway.buscarPorId(idTurno)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe el turno con id " + idTurno));
    }

    public List<Turno> listarTurnos() {
        return turnoGateway.listarTodos();
    }

    public PersonalCocina registrarPersonal(String nombreCompleto, double racionesPorHoraCapacidad, Long idTurno) {
        if (nombreCompleto == null || nombreCompleto.isBlank()) {
            throw new IllegalArgumentException("El nombre del personal no puede estar vacio");
        }
        consultarTurno(idTurno);
        return personalCocinaGateway.guardar(new PersonalCocina(null, nombreCompleto.trim(), racionesPorHoraCapacidad, idTurno));
    }

    public List<PersonalCocina> listarPersonalPorTurno(Long idTurno) {
        consultarTurno(idTurno);
        return personalCocinaGateway.listarPorTurno(idTurno);
    }

    public List<PersonalCocina> listarTodoElPersonal() {
        return personalCocinaGateway.listarTodos();
    }

    public double calcularCapacidadMaximaCocina(Long idTurno) {
        Turno turno = consultarTurno(idTurno);
        double sumaRacionesPorHora = personalCocinaGateway.listarPorTurno(idTurno).stream()
                .mapToDouble(PersonalCocina::getRacionesPorHoraCapacidad)
                .sum();
        return CalculadorIndicadores.capacidadMaximaCocina(sumaRacionesPorHora, turno.getHorasDuracion());
    }
}
