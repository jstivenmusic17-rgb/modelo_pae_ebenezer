package co.edu.iem.pae.domain.model;

import java.util.List;

public final class CalculadorIndicadores {

    public static final double UMBRAL_COBERTURA_MINIMA_DEFECTO = 90.0;

    private CalculadorIndicadores() {
    }

    public static boolean cumpleCoberturaMinima(double coberturaEfectiva, double umbralCoberturaMinima) {
        return coberturaEfectiva >= umbralCoberturaMinima;
    }

    public static double tasaDesperdicio(int racionesSobrantes, int racionesPreparadas) {
        if (racionesPreparadas == 0) return 0;
        return (racionesSobrantes / (double) racionesPreparadas) * 100;
    }

    public static double tasaFaltante(int racionesFaltantes, int demandaReal) {
        if (demandaReal == 0) return 0;
        return (racionesFaltantes / (double) demandaReal) * 100;
    }

    public static double coberturaEfectiva(int estudiantesAtendidos, long matriculaTotal) {
        if (matriculaTotal == 0) return 0;
        return (estudiantesAtendidos / (double) matriculaTotal) * 100;
    }

    public static double porcentajeAusentismo(long matriculaTotal, int presentes) {
        if (matriculaTotal == 0) return 0;
        return ((matriculaTotal - presentes) / (double) matriculaTotal) * 100;
    }

    public static double rendimientoCocina(int racionesServidas, int racionesPreparadas) {
        if (racionesPreparadas == 0) return 0;
        return (racionesServidas / (double) racionesPreparadas) * 100;
    }

    public static double proporcionPorJornada(long matriculaJornada, long matriculaTotal) {
        if (matriculaTotal == 0) return 0;
        return (matriculaJornada / (double) matriculaTotal) * 100;
    }

    public static double costoPromedioPorRacion(double gastoTotal, long racionesServidasTotal) {
        if (racionesServidasTotal == 0) return 0;
        return gastoTotal / racionesServidasTotal;
    }

    public static double errorAbsolutoMedio(List<Integer> planificadas, List<Integer> reales) {
        if (planificadas.isEmpty() || planificadas.size() != reales.size()) return 0;
        long sumaErrores = 0;
        for (int i = 0; i < planificadas.size(); i++) {
            sumaErrores += Math.abs(planificadas.get(i) - reales.get(i));
        }
        return sumaErrores / (double) planificadas.size();
    }

    public static double ahorroPorOptimizacion(double sobrantePromedioAntes, double sobrantePromedioAhora,
                                                long dias, double costoUnitarioSobrante) {
        return (sobrantePromedioAntes - sobrantePromedioAhora) * dias * costoUnitarioSobrante;
    }

    public static double consumoDiarioInsumoKg(long racionesAPreparar, double gramosPorRacion) {
        return (racionesAPreparar * gramosPorRacion) / 1000.0;
    }

    public static double puntoReordenKg(double consumoDiarioPromedioKg, int diasEntregaProveedor, double stockReservaKg) {
        return (consumoDiarioPromedioKg * diasEntregaProveedor) + stockReservaKg;
    }

    public static double capacidadMaximaCocina(double sumaRacionesPorHoraPersonal, double horasTurno) {
        return sumaRacionesPorHoraPersonal * horasTurno;
    }
}
