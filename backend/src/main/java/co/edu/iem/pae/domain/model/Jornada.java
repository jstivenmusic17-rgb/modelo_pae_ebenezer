package co.edu.iem.pae.domain.model;

public class Jornada {
    private final Long idJornada;
    private final String nombreJornada;

    public Jornada(Long idJornada, String nombreJornada) {
        this.idJornada = idJornada;
        this.nombreJornada = nombreJornada;
    }

    public Long getIdJornada() {
        return idJornada;
    }

    public String getNombreJornada() {
        return nombreJornada;
    }
}
