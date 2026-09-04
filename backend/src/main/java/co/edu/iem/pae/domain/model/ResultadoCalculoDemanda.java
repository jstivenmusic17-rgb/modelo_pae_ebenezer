package co.edu.iem.pae.domain.model;

public class ResultadoCalculoDemanda {
    private final int demandaBase;
    private final double desviacionEstandar;
    private final double razonCritica;
    private final double zScore;
    private final int pedidoOptimo;

    public ResultadoCalculoDemanda(int demandaBase, double desviacionEstandar, double razonCritica,
                                    double zScore, int pedidoOptimo) {
        this.demandaBase = demandaBase;
        this.desviacionEstandar = desviacionEstandar;
        this.razonCritica = razonCritica;
        this.zScore = zScore;
        this.pedidoOptimo = pedidoOptimo;
    }

    public int getDemandaBase() {
        return demandaBase;
    }

    public double getDesviacionEstandar() {
        return desviacionEstandar;
    }

    public double getRazonCritica() {
        return razonCritica;
    }

    public double getZScore() {
        return zScore;
    }

    public int getPedidoOptimo() {
        return pedidoOptimo;
    }
}
