package co.edu.iem.pae.domain.model;

public class Estudiante {
    private final Long idEstudiante;
    private final String documentoIdentidad;
    private final String nombreCompleto;
    private final Long idCurso;

    public Estudiante(Long idEstudiante, String documentoIdentidad, String nombreCompleto, Long idCurso) {
        this.idEstudiante = idEstudiante;
        this.documentoIdentidad = documentoIdentidad;
        this.nombreCompleto = nombreCompleto;
        this.idCurso = idCurso;
    }

    public Long getIdEstudiante() {
        return idEstudiante;
    }

    public String getDocumentoIdentidad() {
        return documentoIdentidad;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public Long getIdCurso() {
        return idCurso;
    }
}
