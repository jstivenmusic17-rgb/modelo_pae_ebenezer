package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "personal_cocina", schema = "pae")
public class PersonalCocinaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_personal")
    private Long idPersonal;

    @Column(name = "nombre_completo", nullable = false, length = 150)
    private String nombreCompleto;

    @Column(name = "raciones_por_hora_capacidad", nullable = false)
    private double racionesPorHoraCapacidad;

    @Column(name = "id_turno", nullable = false)
    private Long idTurno;

    protected PersonalCocinaEntity() {
    }

    public PersonalCocinaEntity(Long idPersonal, String nombreCompleto, double racionesPorHoraCapacidad, Long idTurno) {
        this.idPersonal = idPersonal;
        this.nombreCompleto = nombreCompleto;
        this.racionesPorHoraCapacidad = racionesPorHoraCapacidad;
        this.idTurno = idTurno;
    }

    public Long getIdPersonal() {
        return idPersonal;
    }

    public void setIdPersonal(Long idPersonal) {
        this.idPersonal = idPersonal;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public double getRacionesPorHoraCapacidad() {
        return racionesPorHoraCapacidad;
    }

    public void setRacionesPorHoraCapacidad(double racionesPorHoraCapacidad) {
        this.racionesPorHoraCapacidad = racionesPorHoraCapacidad;
    }

    public Long getIdTurno() {
        return idTurno;
    }

    public void setIdTurno(Long idTurno) {
        this.idTurno = idTurno;
    }
}
