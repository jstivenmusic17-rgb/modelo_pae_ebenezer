package co.edu.iem.pae.domain.model;

// Parametros editables del modelo de pedido (vendedor de periodicos). Existe
// un unico juego de parametros para todo el sistema.
public class ParametrosModelo {
    private final double costoProduccionUnitario;
    private final double costoFaltanteUnitario;
    private final double costoSobranteUnitario;
    private final double coeficienteVariacion;
    private final double margenSeguridadReferencia;
    private final double tasaAsistenciaDefecto;

    public ParametrosModelo(double costoProduccionUnitario,
                            double costoFaltanteUnitario,
                            double costoSobranteUnitario,
                            double coeficienteVariacion,
                            double margenSeguridadReferencia,
                            double tasaAsistenciaDefecto) {
        this.costoProduccionUnitario = costoProduccionUnitario;
        this.costoFaltanteUnitario = costoFaltanteUnitario;
        this.costoSobranteUnitario = costoSobranteUnitario;
        this.coeficienteVariacion = coeficienteVariacion;
        this.margenSeguridadReferencia = margenSeguridadReferencia;
        this.tasaAsistenciaDefecto = tasaAsistenciaDefecto;
    }

    // Valores de la simulacion del documento del proyecto (seccion 3.2)
    public static ParametrosModelo porDefecto() {
        return new ParametrosModelo(3200, 5000, 3200,
                CalculadorDemanda.COEFICIENTE_VARIACION_DEFECTO, 0.007, 0.90);
    }

    public void validar() {
        if (costoProduccionUnitario < 0 || costoFaltanteUnitario < 0 || costoSobranteUnitario < 0) {
            throw new IllegalArgumentException("Los costos no pueden ser negativos");
        }
        if (coeficienteVariacion < 0 || coeficienteVariacion > 1) {
            throw new IllegalArgumentException("La variabilidad de la asistencia debe estar entre 0% y 100%");
        }
        if (margenSeguridadReferencia < 0 || margenSeguridadReferencia > 1) {
            throw new IllegalArgumentException("El margen de seguridad de referencia debe estar entre 0% y 100%");
        }
        if (tasaAsistenciaDefecto < 0.5 || tasaAsistenciaDefecto > 1) {
            throw new IllegalArgumentException("La asistencia esperada debe estar entre 50% y 100%");
        }
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
