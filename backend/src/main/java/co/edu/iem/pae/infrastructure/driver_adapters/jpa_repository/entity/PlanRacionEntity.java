package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "plan_racion", schema = "pae")
public class PlanRacionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_plan")
    private Long idPlan;

    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;

    @Column(name = "id_curso", nullable = false)
    private Long idCurso;

    @Column(name = "matricula_total_registrada", nullable = false)
    private long matriculaTotalRegistrada;

    @Column(name = "tasa_asistencia_estimada", nullable = false)
    private double tasaAsistenciaEstimada;

    @Column(name = "raciones_planificadas", nullable = false)
    private int racionesPlanificadas;

    @Column(name = "costo_sobrante_unitario", nullable = false)
    private double costoSobranteUnitario;

    @Column(name = "costo_faltante_unitario", nullable = false)
    private double costoFaltanteUnitario;

    @Column(name = "costo_produccion_unitario")
    private double costoProduccionUnitario;

    @Column(name = "margen_seguridad_usado")
    private double margenSeguridadUsado;

    protected PlanRacionEntity() {
    }

    public PlanRacionEntity(Long idPlan, LocalDate fecha, Long idCurso, long matriculaTotalRegistrada,
                             double tasaAsistenciaEstimada, int racionesPlanificadas,
                             double costoSobranteUnitario, double costoFaltanteUnitario,
                             double costoProduccionUnitario, double margenSeguridadUsado) {
        this.idPlan = idPlan;
        this.fecha = fecha;
        this.idCurso = idCurso;
        this.matriculaTotalRegistrada = matriculaTotalRegistrada;
        this.tasaAsistenciaEstimada = tasaAsistenciaEstimada;
        this.racionesPlanificadas = racionesPlanificadas;
        this.costoSobranteUnitario = costoSobranteUnitario;
        this.costoFaltanteUnitario = costoFaltanteUnitario;
        this.costoProduccionUnitario = costoProduccionUnitario;
        this.margenSeguridadUsado = margenSeguridadUsado;
    }

    public Long getIdPlan() {
        return idPlan;
    }

    public void setIdPlan(Long idPlan) {
        this.idPlan = idPlan;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public Long getIdCurso() {
        return idCurso;
    }

    public void setIdCurso(Long idCurso) {
        this.idCurso = idCurso;
    }

    public long getMatriculaTotalRegistrada() {
        return matriculaTotalRegistrada;
    }

    public void setMatriculaTotalRegistrada(long matriculaTotalRegistrada) {
        this.matriculaTotalRegistrada = matriculaTotalRegistrada;
    }

    public double getTasaAsistenciaEstimada() {
        return tasaAsistenciaEstimada;
    }

    public void setTasaAsistenciaEstimada(double tasaAsistenciaEstimada) {
        this.tasaAsistenciaEstimada = tasaAsistenciaEstimada;
    }

    public int getRacionesPlanificadas() {
        return racionesPlanificadas;
    }

    public void setRacionesPlanificadas(int racionesPlanificadas) {
        this.racionesPlanificadas = racionesPlanificadas;
    }

    public double getCostoSobranteUnitario() {
        return costoSobranteUnitario;
    }

    public void setCostoSobranteUnitario(double costoSobranteUnitario) {
        this.costoSobranteUnitario = costoSobranteUnitario;
    }

    public double getCostoFaltanteUnitario() {
        return costoFaltanteUnitario;
    }

    public void setCostoFaltanteUnitario(double costoFaltanteUnitario) {
        this.costoFaltanteUnitario = costoFaltanteUnitario;
    }

    public double getCostoProduccionUnitario() {
        return costoProduccionUnitario;
    }

    public void setCostoProduccionUnitario(double costoProduccionUnitario) {
        this.costoProduccionUnitario = costoProduccionUnitario;
    }

    public double getMargenSeguridadUsado() {
        return margenSeguridadUsado;
    }

    public void setMargenSeguridadUsado(double margenSeguridadUsado) {
        this.margenSeguridadUsado = margenSeguridadUsado;
    }
}
