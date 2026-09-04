package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "entrega_racion", schema = "pae")
public class EntregaRacionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_entrega")
    private Long idEntrega;

    @Column(name = "id_plan", nullable = false, unique = true)
    private Long idPlan;

    @Column(name = "raciones_servidas", nullable = false)
    private int racionesServidas;

    protected EntregaRacionEntity() {
    }

    public EntregaRacionEntity(Long idEntrega, Long idPlan, int racionesServidas) {
        this.idEntrega = idEntrega;
        this.idPlan = idPlan;
        this.racionesServidas = racionesServidas;
    }

    public Long getIdEntrega() {
        return idEntrega;
    }

    public void setIdEntrega(Long idEntrega) {
        this.idEntrega = idEntrega;
    }

    public Long getIdPlan() {
        return idPlan;
    }

    public void setIdPlan(Long idPlan) {
        this.idPlan = idPlan;
    }

    public int getRacionesServidas() {
        return racionesServidas;
    }

    public void setRacionesServidas(int racionesServidas) {
        this.racionesServidas = racionesServidas;
    }
}
