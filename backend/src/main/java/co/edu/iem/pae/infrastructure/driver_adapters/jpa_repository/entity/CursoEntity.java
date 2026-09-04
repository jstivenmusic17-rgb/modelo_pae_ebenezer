package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "curso", schema = "pae")
public class CursoEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_curso")
    private Long idCurso;

    @Column(name = "nombre_curso", nullable = false, length = 50)
    private String nombreCurso;

    @Column(name = "id_jornada", nullable = false)
    private Long idJornada;

    protected CursoEntity() {
    }

    public CursoEntity(Long idCurso, String nombreCurso, Long idJornada) {
        this.idCurso = idCurso;
        this.nombreCurso = nombreCurso;
        this.idJornada = idJornada;
    }

    public Long getIdCurso() {
        return idCurso;
    }

    public void setIdCurso(Long idCurso) {
        this.idCurso = idCurso;
    }

    public String getNombreCurso() {
        return nombreCurso;
    }

    public void setNombreCurso(String nombreCurso) {
        this.nombreCurso = nombreCurso;
    }

    public Long getIdJornada() {
        return idJornada;
    }

    public void setIdJornada(Long idJornada) {
        this.idJornada = idJornada;
    }
}
