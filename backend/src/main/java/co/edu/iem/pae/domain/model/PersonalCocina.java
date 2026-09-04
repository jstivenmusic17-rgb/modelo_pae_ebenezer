package co.edu.iem.pae.domain.model;

public class PersonalCocina {

    private final Long idPersonal;
    private final String nombreCompleto;
    private final double racionesPorHoraCapacidad;
    private final Long idTurno;

    public PersonalCocina(Long idPersonal, String nombreCompleto, double racionesPorHoraCapacidad, Long idTurno) {
        this.idPersonal = idPersonal;
        this.nombreCompleto = nombreCompleto;
        this.racionesPorHoraCapacidad = racionesPorHoraCapacidad;
        this.idTurno = idTurno;
    }

    public Long getIdPersonal() {
        return idPersonal;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public double getRacionesPorHoraCapacidad() {
        return racionesPorHoraCapacidad;
    }

    public Long getIdTurno() {
        return idTurno;
    }
}
