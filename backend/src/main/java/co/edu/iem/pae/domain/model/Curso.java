package co.edu.iem.pae.domain.model;

public class Curso {
    private final Long idCurso;
    private final String nombreCurso;
    private final Long idJornada;

    public Curso(Long idCurso, String nombreCurso, Long idJornada) {
        this.idCurso = idCurso;
        this.nombreCurso = nombreCurso;
        this.idJornada = idJornada;
    }

    public Long getIdCurso() {
        return idCurso;
    }

    public String getNombreCurso() {
        return nombreCurso;
    }

    public Long getIdJornada() {
        return idJornada;
    }
}
