package co.edu.iem.pae.infrastructure.driver_adapters.jpa_repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

// Tabla de una sola fila (id = 1) con los parametros del modelo
@Entity
@Table(name = "parametros_modelo", schema = "pae")
public class ParametrosModeloEntity {
    public static final Long ID_UNICO = 1L;

    @Id
    @Column(name = "id_parametros")
    private Long idParametros;

    @Column(name = "costo_produccion_unitario", nullable = false)
    private double costoProduccionUnitario;

    @Column(name = "costo_faltante_unitario", nullable = false)
    private double costoFaltanteUnitario;

    @Column(name = "costo_sobrante_unitario", nullable = false)
    private double costoSobranteUnitario;

    @Column(name = "coeficiente_variacion", nullable = false)
    private double coeficienteVariacion;

    @Column(name = "margen_seguridad_referencia", nullable = false)
    private double margenSeguridadReferencia;

    @Column(name = "tasa_asistencia_defecto", nullable = false)
    private double tasaAsistenciaDefecto;

    protected ParametrosModeloEntity() {
    }

    public ParametrosModeloEntity(Long idParametros, double costoProduccionUnitario, double costoFaltanteUnitario,
                                  double costoSobranteUnitario, double coeficienteVariacion,
                                  double margenSeguridadReferencia, double tasaAsistenciaDefecto) {
        this.idParametros = idParametros;
        this.costoProduccionUnitario = costoProduccionUnitario;
        this.costoFaltanteUnitario = costoFaltanteUnitario;
        this.costoSobranteUnitario = costoSobranteUnitario;
        this.coeficienteVariacion = coeficienteVariacion;
        this.margenSeguridadReferencia = margenSeguridadReferencia;
        this.tasaAsistenciaDefecto = tasaAsistenciaDefecto;
    }

    public Long getIdParametros() {
        return idParametros;
    }

    public double getCostoProduccionUnitario() {
        return costoProduccionUnitario;
    }

    public double getCostoFaltanteUnitario() {
        return costoFaltanteUnitario;
    }

    public double getCostoSobranteUnitario() {
        return costoSobranteUnitario;
    }

    public double getCoeficienteVariacion() {
        return coeficienteVariacion;
    }

    public double getMargenSeguridadReferencia() {
        return margenSeguridadReferencia;
    }

    public double getTasaAsistenciaDefecto() {
        return tasaAsistenciaDefecto;
    }
}
