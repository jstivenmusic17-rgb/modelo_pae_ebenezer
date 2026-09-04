package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "turno", schema = "pae")
public class TurnoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_turno")
    private Long idTurno;

    @Column(name = "nombre_turno", nullable = false, length = 50)
    private String nombreTurno;

    @Column(name = "horas_duracion", nullable = false)
    private double horasDuracion;

    protected TurnoEntity() {
    }

    public TurnoEntity(Long idTurno, String nombreTurno, double horasDuracion) {
        this.idTurno = idTurno;
        this.nombreTurno = nombreTurno;
        this.horasDuracion = horasDuracion;
    }

    public Long getIdTurno() {
        return idTurno;
    }

    public void setIdTurno(Long idTurno) {
        this.idTurno = idTurno;
    }

    public String getNombreTurno() {
        return nombreTurno;
    }

    public void setNombreTurno(String nombreTurno) {
        this.nombreTurno = nombreTurno;
    }

    public double getHorasDuracion() {
        return horasDuracion;
    }

    public void setHorasDuracion(double horasDuracion) {
        this.horasDuracion = horasDuracion;
    }
}
