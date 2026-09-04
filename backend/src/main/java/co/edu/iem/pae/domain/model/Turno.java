package co.edu.iem.pae.domain.model;

public class Turno {

    private final Long idTurno;
    private final String nombreTurno;
    private final double horasDuracion;

    public Turno(Long idTurno, String nombreTurno, double horasDuracion) {
        this.idTurno = idTurno;
        this.nombreTurno = nombreTurno;
        this.horasDuracion = horasDuracion;
    }

    public Long getIdTurno() {
        return idTurno;
    }

    public String getNombreTurno() {
        return nombreTurno;
    }

    public double getHorasDuracion() {
        return horasDuracion;
    }
}
