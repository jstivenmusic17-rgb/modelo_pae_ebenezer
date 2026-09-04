package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "jornada", schema = "pae")
public class JornadaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_jornada")
    private Long idJornada;

    @Column(name = "nombre_jornada", nullable = false, length = 50)
    private String nombreJornada;

    protected JornadaEntity() {
    }

    public JornadaEntity(Long idJornada, String nombreJornada) {
        this.idJornada = idJornada;
        this.nombreJornada = nombreJornada;
    }

    public Long getIdJornada() {
        return idJornada;
    }

    public void setIdJornada(Long idJornada) {
        this.idJornada = idJornada;
    }

    public String getNombreJornada() {
        return nombreJornada;
    }

    public void setNombreJornada(String nombreJornada) {
        this.nombreJornada = nombreJornada;
    }
}
