package co.edu.iem.pae.domain.model;

public final class CalculadorDemanda {
    public static final double COEFICIENTE_VARIACION_DEFECTO = 0.10;

    private CalculadorDemanda() {
    }

    public static int calcularDemandaBase(long matriculaTotal, double tasaAsistenciaEstimada) {
        if (matriculaTotal < 0) {
            throw new IllegalArgumentException("La matricula total no puede ser negativa");
        }
        if (tasaAsistenciaEstimada <= 0 || tasaAsistenciaEstimada > 1) {
            throw new IllegalArgumentException("La tasa de asistencia estimada debe estar entre 0 (exclusivo) y 1 (ej: 0.90 para 90%)");
        }
        return (int) Math.round(matriculaTotal * tasaAsistenciaEstimada);
    }

    public static double calcularRazonCritica(double costoFaltanteUnitario, double costoSobranteUnitario) {
        if (costoFaltanteUnitario < 0 || costoSobranteUnitario < 0) {
            throw new IllegalArgumentException("Los costos unitarios no pueden ser negativos");
        }
        double denominador = costoFaltanteUnitario + costoSobranteUnitario;
        if (denominador == 0) {
            return 0.5;
        }
        return costoFaltanteUnitario / denominador;
    }

    public static double calcularZScore(double razonCritica) {
        double p = razonCritica;

        double epsilon = 1e-9;
        if (p <= 0) p = epsilon;
        if (p >= 1) p = 1 - epsilon;
        return inversaNormalEstandar(p);
    }

    public static int calcularPedidoOptimo(int demandaBase, double desviacionEstandar, double zScore) {
        double pedido = demandaBase + zScore * desviacionEstandar;
        return (int) Math.max(0, Math.round(pedido));
    }

    public static int calcularRacionesSugeridasMargen(int demandaBase, double margenSeguridad) {
        if (margenSeguridad < 0) {
            throw new IllegalArgumentException("El margen de seguridad no puede ser negativo");
        }
        return (int) Math.round(demandaBase * (1 + margenSeguridad));
    }

    public static ResultadoCalculoDemanda calcular(long matriculaTotal,
                                                     double tasaAsistenciaEstimada,
                                                     double costoSobranteUnitario,
                                                     double costoFaltanteUnitario,
                                                     double coeficienteVariacion) {
        if (coeficienteVariacion < 0) {
            throw new IllegalArgumentException("El coeficiente de variacion no puede ser negativo");
        }

        int demandaBase = calcularDemandaBase(matriculaTotal, tasaAsistenciaEstimada);
        double desviacionEstandar = demandaBase * coeficienteVariacion;
        double razonCritica = calcularRazonCritica(costoFaltanteUnitario, costoSobranteUnitario);
        double zScore = calcularZScore(razonCritica);
        int pedidoOptimo = calcularPedidoOptimo(demandaBase, desviacionEstandar, zScore);

        return new ResultadoCalculoDemanda(demandaBase, desviacionEstandar, razonCritica, zScore, pedidoOptimo);
    }

    private static double inversaNormalEstandar(double p) {
        final double a1 = -3.969683028665376e+01;
        final double a2 = 2.209460984245205e+02;
        final double a3 = -2.759285104469687e+02;
        final double a4 = 1.383577518672690e+02;
        final double a5 = -3.066479806614716e+01;
        final double a6 = 2.506628277459239e+00;

        final double b1 = -5.447609879822406e+01;
        final double b2 = 1.615858368580409e+02;
        final double b3 = -1.556989798598866e+02;
        final double b4 = 6.680131188771972e+01;
        final double b5 = -1.328068155288572e+01;

        final double c1 = -7.784894002430293e-03;
        final double c2 = -3.223964580411365e-01;
        final double c3 = -2.400758277161838e+00;
        final double c4 = -2.549732539343734e+00;
        final double c5 = 4.374664141464968e+00;
        final double c6 = 2.938163982698783e+00;

        final double d1 = 7.784695709041462e-03;
        final double d2 = 3.224671290700398e-01;
        final double d3 = 2.445134137142996e+00;
        final double d4 = 3.754408661907416e+00;

        final double pLow = 0.02425;
        final double pHigh = 1 - pLow;

        if (p < pLow) {
            double q = Math.sqrt(-2 * Math.log(p));
            return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
                    / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        } else if (p <= pHigh) {
            double q = p - 0.5;
            double r = q * q;
            return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q
                    / (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
        } else {
            double q = Math.sqrt(-2 * Math.log(1 - p));
            return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6)
                    / ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
        }
    }
}
